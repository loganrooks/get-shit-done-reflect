#!/usr/bin/env python3
"""
extract-session-fingerprints.py — Phase 60 cross-runtime log-sensor extractor.

Usage: python3 extract-session-fingerprints.py <session-jsonl-path>
Output: Single JSON line on stdout with the normalized fingerprint schema.
Errors: Parse/format failures are embedded in the output as SENS-07 diagnostic fields,
        not raised as exceptions.

Dependencies: Python 3 stdlib only.
"""

import json
import sys
from collections import Counter


CODEX_KNOWN_EVENT_MSG_TYPES = {
    "user_message",
    "agent_message",
    "token_count",
    "turn_aborted",
    "task_started",
    "task_complete",
    "exec_command_end",
    "patch_apply_end",
    "context_compacted",
    "collab_waiting_end",
    "collab_agent_spawn_end",
    "collab_close_end",
    "collab_agent_interaction_end",
    "mcp_tool_call_end",
    "item_completed",
    "thread_rolled_back",
    "web_search_end",
}

CODEX_KNOWN_RESPONSE_ITEM_TYPES = {
    "function_call",
    "function_call_output",
    "reasoning",
    "message",
    "custom_tool_call",
    "custom_tool_call_output",
    "web_search_call",
}


def detect_format(path):
    """Return 'claude' | 'codex' | None based on the first event."""
    try:
        with open(path, "r", encoding="utf-8") as handle:
            first = handle.readline()
        obj = json.loads(first)
    except (OSError, json.JSONDecodeError):
        return None

    event_type = obj.get("type")
    if event_type == "session_meta":
        return "codex"
    if event_type in ("system", "user", "assistant", "summary"):
        return "claude"
    return None


def _empty_fingerprint():
    return {
        "session_id": None,
        "start_time": None,
        "end_time": None,
        "user_message_count": 0,
        "assistant_message_count": 0,
        "tool_call_count": 0,
        "tool_error_count": 0,
        "total_tokens": 0,
        "model": None,
        "interruptions": 0,
        "direction_changes": None,
        "reasoning_output_tokens": "not_available",
        "rate_limit_primary_used_percent": "not_available",
        "model_context_window": "not_available",
        "source": "not_available",
        "agent_role": "not_available",
        "_sens07_parse_errors": [],
        "_sens07_unknown_event_msg_types": {},
        "_sens07_unknown_response_item_types": {},
    }


def _read_lines(path):
    with open(path, "r", encoding="utf-8") as handle:
        for lineno, raw in enumerate(handle, 1):
            line = raw.strip()
            if line:
                yield lineno, line


def _extract_claude_text(content):
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                parts.append(item.get("text", ""))
        return " ".join(part for part in parts if part)
    if isinstance(content, str):
        return content
    return str(content or "")


def extract_claude_fingerprint(path):
    result = _empty_fingerprint()
    result["_format"] = "claude"
    parse_errors = []

    try:
        for lineno, line in _read_lines(path):
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                parse_errors.append({"line_number": lineno, "snippet": line[:120]})
                continue

            event_type = obj.get("type")
            timestamp = obj.get("timestamp")
            if timestamp and not result["start_time"]:
                result["start_time"] = timestamp
            if timestamp:
                result["end_time"] = timestamp

            if event_type == "system":
                result["session_id"] = obj.get("session_id") or obj.get("sessionId") or result["session_id"]
                continue

            if event_type == "user":
                result["session_id"] = obj.get("session_id") or obj.get("sessionId") or result["session_id"]
                result["user_message_count"] += 1
                continue

            if event_type != "assistant":
                continue

            result["assistant_message_count"] += 1
            msg = obj.get("message", {})
            if not isinstance(msg, dict):
                continue

            result["model"] = msg.get("model") or result["model"]
            usage = msg.get("usage", {}) or {}
            result["total_tokens"] += int(usage.get("input_tokens") or 0)
            result["total_tokens"] += int(usage.get("output_tokens") or 0)

            content = msg.get("content", [])
            if isinstance(content, list):
                for item in content:
                    if not isinstance(item, dict):
                        continue
                    if item.get("type") == "tool_use":
                        result["tool_call_count"] += 1
                    if item.get("type") == "tool_result" and item.get("is_error"):
                        result["tool_error_count"] += 1
            else:
                _extract_claude_text(content)
    except OSError as error:
        parse_errors.append({"line_number": 0, "snippet": f"IOError: {error}"})

    result["_sens07_parse_errors"] = parse_errors
    return result


def _extract_codex_agent_role(payload):
    if payload.get("agent_role"):
        return payload.get("agent_role")

    source = payload.get("source")
    if isinstance(source, dict):
        subagent = source.get("subagent")
        if isinstance(subagent, dict):
            for value in subagent.values():
                if isinstance(value, dict) and value.get("agent_role"):
                    return value.get("agent_role")
    return None


def _extract_codex_source(payload):
    source = payload.get("source")
    if isinstance(source, str):
        return source
    return "not_available"


def extract_codex_fingerprint(path):
    result = _empty_fingerprint()
    result["_format"] = "codex"
    parse_errors = []
    unknown_event_types = Counter()
    unknown_response_types = Counter()

    try:
        for lineno, line in _read_lines(path):
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                parse_errors.append({"line_number": lineno, "snippet": line[:120]})
                continue

            event_type = obj.get("type")
            payload = obj.get("payload", {})
            if not isinstance(payload, dict):
                payload = {}

            timestamp = obj.get("timestamp")
            if timestamp and not result["start_time"]:
                result["start_time"] = timestamp
            if timestamp:
                result["end_time"] = timestamp

            if event_type == "session_meta":
                result["session_id"] = payload.get("id")
                result["source"] = _extract_codex_source(payload)
                agent_role = _extract_codex_agent_role(payload)
                if agent_role:
                    result["agent_role"] = agent_role
                continue

            if event_type == "turn_context":
                result["model"] = payload.get("model") or result["model"]
                continue

            if event_type == "event_msg":
                payload_type = payload.get("type")
                if payload_type == "user_message":
                    result["user_message_count"] += 1
                elif payload_type == "agent_message":
                    result["assistant_message_count"] += 1
                elif payload_type == "token_count":
                    info = payload.get("info", {}) or {}
                    total_usage = info.get("total_token_usage", {}) or {}
                    if total_usage.get("total_tokens") is not None:
                        result["total_tokens"] = total_usage.get("total_tokens")
                    reasoning_tokens = total_usage.get("reasoning_output_tokens")
                    if reasoning_tokens is not None:
                        result["reasoning_output_tokens"] = reasoning_tokens
                    context_window = total_usage.get("model_context_window")
                    if context_window is not None:
                        result["model_context_window"] = context_window
                    rate_limits = payload.get("rate_limits", {}) or {}
                    primary = rate_limits.get("primary", {}) or {}
                    used_percent = primary.get("used_percent")
                    if used_percent is not None:
                        result["rate_limit_primary_used_percent"] = used_percent
                elif payload_type == "turn_aborted":
                    result["interruptions"] += 1
                elif payload_type in CODEX_KNOWN_EVENT_MSG_TYPES:
                    pass
                else:
                    unknown_event_types[payload_type or "<null>"] += 1
                continue

            if event_type == "response_item":
                payload_type = payload.get("type")
                if payload_type == "function_call":
                    result["tool_call_count"] += 1
                elif payload_type == "function_call_output":
                    output = payload.get("output")
                    success = payload.get("success")
                    if success is False or "error" in str(output or "").lower():
                        result["tool_error_count"] += 1
                elif payload_type in CODEX_KNOWN_RESPONSE_ITEM_TYPES:
                    pass
                else:
                    unknown_response_types[payload_type or "<null>"] += 1
                continue

            if event_type == "compacted":
                continue

            unknown_event_types[f"<top:{event_type}>"] += 1
    except OSError as error:
        parse_errors.append({"line_number": 0, "snippet": f"IOError: {error}"})

    result["_sens07_parse_errors"] = parse_errors
    result["_sens07_unknown_event_msg_types"] = dict(unknown_event_types)
    result["_sens07_unknown_response_item_types"] = dict(unknown_response_types)
    return result


def main():
    if len(sys.argv) != 2:
        print(json.dumps({"_format": "error", "_sens07_error": "missing_path_arg"}))
        return

    path = sys.argv[1]
    format_name = detect_format(path)
    if format_name == "claude":
        result = extract_claude_fingerprint(path)
    elif format_name == "codex":
        result = extract_codex_fingerprint(path)
    else:
        result = {
            "_format": "unknown",
            "_path": path,
            "_sens07_error": "format_detection_failed",
            "_sens07_parse_errors": [],
            "_sens07_unknown_event_msg_types": {},
            "_sens07_unknown_response_item_types": {},
        }

    print(json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    main()
