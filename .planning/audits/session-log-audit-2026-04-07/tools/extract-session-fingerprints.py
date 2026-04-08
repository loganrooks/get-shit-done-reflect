#!/usr/bin/env python3
"""
Session Log Structural Fingerprinting — Tier 1 Extraction

Extracts compact structural fingerprints from Claude Code session logs (JSONL).
Used by both:
  (1) Cross-project audit (temporary, all projects)
  (2) Log sensor (permanent, single project/phase)

Output: One JSON object per session file with structural metrics,
conversation flow patterns, and candidate event markers.

Token cost to the analyzing agent: ~40-60 lines per session.
"""

import json
import sys
import os
import re
from datetime import datetime, timezone
from collections import Counter, defaultdict
from pathlib import Path


def parse_timestamp(ts_str):
    """Parse ISO timestamp, handling Z suffix."""
    if not ts_str:
        return None
    try:
        return datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
    except (ValueError, TypeError):
        return None


def extract_fingerprint(session_path):
    """Extract structural fingerprint from a single session JSONL file."""

    messages = []  # (type, role, timestamp, content_length, metadata)
    tool_calls = []  # (tool_name, timestamp)
    tool_results = []  # (is_error, tool_name, timestamp)
    token_usage = []  # (input, cache_create, cache_read, output, timestamp)
    models = Counter()

    # Conversation flow tracking
    user_messages = []  # (timestamp, content_length, first_50_chars)
    assistant_messages = []  # (timestamp, content_length, has_thinking)

    # Event markers
    interruptions = []  # short user msg after long assistant output
    direction_changes = []  # user msgs starting with negation/correction
    backtracking = []  # assistant msgs with apology/correction language
    agent_spawns = []  # subagent/background task launches

    prev_assistant_len = 0
    prev_type = None

    # Patterns for direction changes (user correcting/redirecting)
    direction_re = re.compile(
        r'^\s*(no[,.\s]|actually|wait|stop|instead|not that|don\'t|'
        r'that\'s (not|wrong)|I (meant|said|want)|let me clarify|'
        r'hold on|scratch that|forget|never\s?mind)',
        re.IGNORECASE
    )

    # Patterns for agent backtracking
    backtrack_re = re.compile(
        r'(I apologize|you\'re right|let me reconsider|I should have|'
        r'I made (a |an )?(mistake|error)|that was wrong|'
        r'I misunderstood|sorry,? (I|let me)|my (mistake|bad|error)|'
        r'correction:|actually,? (you\'re|that\'s) right)',
        re.IGNORECASE
    )

    # Patterns for user providing answers (doing agent's job)
    user_provides_re = re.compile(
        r'(here[,:]?\s*(just|try)|the (answer|fix|solution|issue|problem) is|'
        r'you need to|it should be|the file is at|look at |'
        r'run this|use this|try this instead)',
        re.IGNORECASE
    )

    line_count = 0
    session_id = Path(session_path).stem

    try:
        with open(session_path, 'r', errors='replace') as f:
            for line in f:
                line_count += 1
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue

                msg_type = obj.get('type', '')
                timestamp = obj.get('timestamp', '')
                ts = parse_timestamp(timestamp)

                if msg_type == 'user':
                    msg = obj.get('message', {})
                    content = msg.get('content', '')

                    # Handle both string and list content
                    if isinstance(content, list):
                        text_parts = []
                        has_tool_result = False
                        for part in content:
                            if isinstance(part, dict):
                                if part.get('type') == 'text':
                                    text_parts.append(part.get('text', ''))
                                elif part.get('type') == 'tool_result':
                                    has_tool_result = True
                                    is_err = part.get('is_error', False)
                                    tool_results.append((is_err, '', timestamp))
                            elif isinstance(part, str):
                                text_parts.append(part)
                        content_text = ' '.join(text_parts)
                    else:
                        content_text = str(content)
                        has_tool_result = False

                    content_len = len(content_text)
                    first_80 = content_text[:80].replace('\n', ' ').strip()

                    if not has_tool_result and content_text.strip():
                        user_messages.append((timestamp, content_len, first_80))

                        # Interruption detection: short user msg after long assistant
                        if prev_type == 'assistant' and content_len < 100 and prev_assistant_len > 500:
                            interruptions.append({
                                'timestamp': timestamp,
                                'user_len': content_len,
                                'prev_assistant_len': prev_assistant_len,
                                'snippet': first_80
                            })

                        # Direction change detection
                        if direction_re.search(content_text):
                            direction_changes.append({
                                'timestamp': timestamp,
                                'snippet': first_80
                            })

                        # User providing the answer
                        if user_provides_re.search(content_text):
                            # Only flag if content is substantial (not just "try this")
                            if content_len > 50:
                                direction_changes.append({
                                    'timestamp': timestamp,
                                    'snippet': first_80,
                                    'subtype': 'user_provides_answer'
                                })

                    prev_type = 'user'

                elif msg_type == 'assistant':
                    msg = obj.get('message', {})
                    content = msg.get('content', [])
                    usage = msg.get('usage', {})
                    model = msg.get('model', '')

                    if model:
                        models[model] += 1

                    # Token tracking
                    if usage:
                        token_usage.append({
                            'input': usage.get('input_tokens', 0),
                            'cache_create': usage.get('cache_creation_input_tokens', 0),
                            'cache_read': usage.get('cache_read_input_tokens', 0),
                            'output': usage.get('output_tokens', 0),
                            'timestamp': timestamp
                        })

                    # Parse content blocks
                    total_text_len = 0
                    has_thinking = False
                    thinking_text = ''
                    text_content = ''

                    if isinstance(content, list):
                        for block in content:
                            if isinstance(block, dict):
                                if block.get('type') == 'thinking':
                                    has_thinking = True
                                    thinking_text += block.get('thinking', '')
                                elif block.get('type') == 'text':
                                    text_content += block.get('text', '')
                                    total_text_len += len(block.get('text', ''))
                                elif block.get('type') == 'tool_use':
                                    tool_name = block.get('name', '?')
                                    tool_calls.append((tool_name, timestamp))
                                    # Track agent spawns
                                    if tool_name == 'Agent':
                                        agent_spawns.append({
                                            'timestamp': timestamp,
                                            'input_snippet': str(block.get('input', {}))[:100]
                                        })

                    combined_text = thinking_text + ' ' + text_content
                    assistant_messages.append((timestamp, total_text_len, has_thinking))
                    prev_assistant_len = total_text_len

                    # Backtracking detection
                    if backtrack_re.search(combined_text):
                        backtracking.append({
                            'timestamp': timestamp,
                            'snippet': combined_text[:120].replace('\n', ' ').strip()
                        })

                    prev_type = 'assistant'

    except Exception as e:
        return {'error': str(e), 'session_id': session_id, 'path': session_path}

    # Compute derived metrics
    sorted_timestamps = sorted(set(
        parse_timestamp(m[0]) for m in user_messages + assistant_messages
        if parse_timestamp(m[0])
    ))

    # Time gaps
    gaps = []
    for i in range(1, len(sorted_timestamps)):
        gap_sec = (sorted_timestamps[i] - sorted_timestamps[i-1]).total_seconds()
        if gap_sec > 120:  # only track gaps > 2 min
            gaps.append({
                'seconds': int(gap_sec),
                'after': sorted_timestamps[i-1].isoformat(),
                'before': sorted_timestamps[i].isoformat()
            })

    # Consecutive error streaks
    max_streak = 0
    current_streak = 0
    streak_tools = []
    worst_streak_tools = []
    for r in tool_results:
        if r[0]:  # is_error
            current_streak += 1
            streak_tools.append(r[1])
            if current_streak > max_streak:
                max_streak = current_streak
                worst_streak_tools = list(streak_tools[-5:])
        else:
            current_streak = 0
            streak_tools = []

    # Tool call frequency
    tool_counter = Counter(tc[0] for tc in tool_calls)

    # Token totals
    total_input = sum(t['input'] + t['cache_create'] + t['cache_read'] for t in token_usage)
    total_output = sum(t['output'] for t in token_usage)

    # Session duration
    duration_min = None
    if sorted_timestamps and len(sorted_timestamps) >= 2:
        duration_min = round((sorted_timestamps[-1] - sorted_timestamps[0]).total_seconds() / 60, 1)

    return {
        'session_id': session_id,
        'path': session_path,
        'line_count': line_count,
        'duration_minutes': duration_min,
        'first_timestamp': sorted_timestamps[0].isoformat() if sorted_timestamps else None,
        'last_timestamp': sorted_timestamps[-1].isoformat() if sorted_timestamps else None,

        # Message flow
        'user_message_count': len(user_messages),
        'assistant_message_count': len(assistant_messages),
        'user_avg_length': round(sum(m[1] for m in user_messages) / max(len(user_messages), 1)),
        'assistant_avg_length': round(sum(m[1] for m in assistant_messages) / max(len(assistant_messages), 1)),

        # Tool usage
        'tool_call_count': len(tool_calls),
        'tool_error_count': sum(1 for r in tool_results if r[0]),
        'tool_error_rate_pct': round(sum(1 for r in tool_results if r[0]) / max(len(tool_results), 1) * 100, 1),
        'max_consecutive_errors': max_streak,
        'worst_streak_tools': worst_streak_tools,
        'top_tools': dict(tool_counter.most_common(5)),

        # Token usage
        'total_input_tokens': total_input,
        'total_output_tokens': total_output,
        'total_tokens': total_input + total_output,
        'models': dict(models.most_common(3)),

        # Event markers (the interesting stuff)
        'interruptions': interruptions[:10],  # cap for output size
        'direction_changes': direction_changes[:10],
        'backtracking': backtracking[:10],
        'agent_spawns_count': len(agent_spawns),

        # Time patterns
        'gaps_over_2min': len([g for g in gaps if g['seconds'] > 120]),
        'gaps_over_5min': len([g for g in gaps if g['seconds'] > 300]),
        'gaps_over_10min': len([g for g in gaps if g['seconds'] > 600]),
        'max_gap_minutes': round(max((g['seconds'] for g in gaps), default=0) / 60, 1),
        'significant_gaps': [g for g in gaps if g['seconds'] > 300][:5],

        # Interest score (heuristic for triage priority)
        'interest_signals': {
            'has_interruptions': len(interruptions) > 0,
            'has_direction_changes': len(direction_changes) > 0,
            'has_backtracking': len(backtracking) > 0,
            'high_error_rate': sum(1 for r in tool_results if r[0]) / max(len(tool_results), 1) > 0.15,
            'long_session': (duration_min or 0) > 30,
            'high_token_usage': total_input + total_output > 500000,
        }
    }


def scan_project_logs(claude_projects_dir, max_age_days=14, project_filter=None):
    """Scan all project session logs under the Claude projects directory."""
    results = {}

    if not os.path.isdir(claude_projects_dir):
        return results

    cutoff = datetime.now(timezone.utc).timestamp() - (max_age_days * 86400)

    for project_dir in sorted(os.listdir(claude_projects_dir)):
        project_path = os.path.join(claude_projects_dir, project_dir)
        if not os.path.isdir(project_path):
            continue

        if project_filter and project_dir not in project_filter:
            continue

        sessions = []
        for f in os.listdir(project_path):
            if not f.endswith('.jsonl'):
                continue
            fpath = os.path.join(project_path, f)
            if os.path.getmtime(fpath) < cutoff:
                continue
            sessions.append(fpath)

        if sessions:
            # Sort by modification time, most recent first
            sessions.sort(key=os.path.getmtime, reverse=True)
            project_fingerprints = []
            for spath in sessions:
                fp = extract_fingerprint(spath)
                project_fingerprints.append(fp)
                # Progress indicator to stderr
                interest = sum(1 for v in fp.get('interest_signals', {}).values() if v)
                print(f"  [{interest}/6 interest] {os.path.basename(spath)[:40]}...", file=sys.stderr)

            results[project_dir] = {
                'session_count': len(project_fingerprints),
                'sessions': project_fingerprints
            }

    return results


def compute_summary(results):
    """Compute cross-project summary statistics."""
    total_sessions = 0
    total_tokens = 0
    interesting_sessions = []

    for project, data in results.items():
        for session in data['sessions']:
            total_sessions += 1
            total_tokens += session.get('total_tokens', 0)

            interest_count = sum(1 for v in session.get('interest_signals', {}).values() if v)
            if interest_count >= 2:  # at least 2 interest signals
                interesting_sessions.append({
                    'project': project,
                    'session_id': session['session_id'],
                    'interest_count': interest_count,
                    'interest_signals': session['interest_signals'],
                    'duration_minutes': session.get('duration_minutes'),
                    'interruptions': len(session.get('interruptions', [])),
                    'direction_changes': len(session.get('direction_changes', [])),
                    'backtracking': len(session.get('backtracking', [])),
                    'error_rate': session.get('tool_error_rate_pct', 0),
                    'total_tokens': session.get('total_tokens', 0),
                })

    # Sort by interest score descending
    interesting_sessions.sort(key=lambda x: x['interest_count'], reverse=True)

    return {
        'total_sessions': total_sessions,
        'total_tokens': total_tokens,
        'interesting_session_count': len(interesting_sessions),
        'top_interesting': interesting_sessions[:30]  # top 30 for agent triage
    }


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Extract session log structural fingerprints')
    parser.add_argument('--claude-dir', default=os.path.expanduser('~/.claude/projects'),
                        help='Claude projects directory')
    parser.add_argument('--max-age', type=int, default=14,
                        help='Maximum age in days (default: 14)')
    parser.add_argument('--output', default='-',
                        help='Output file (default: stdout)')
    parser.add_argument('--summary-only', action='store_true',
                        help='Output only the cross-project summary')
    parser.add_argument('--project', action='append', dest='projects',
                        help='Filter to specific project(s)')

    args = parser.parse_args()

    print(f"Scanning {args.claude_dir} (last {args.max_age} days)...", file=sys.stderr)

    results = scan_project_logs(args.claude_dir, args.max_age, args.projects)
    summary = compute_summary(results)

    print(f"\nDone: {summary['total_sessions']} sessions, "
          f"{summary['interesting_session_count']} interesting, "
          f"{summary['total_tokens']:,} total tokens", file=sys.stderr)

    output = {
        'extraction_timestamp': datetime.now(timezone.utc).isoformat(),
        'source_dir': args.claude_dir,
        'max_age_days': args.max_age,
        'summary': summary,
    }

    if not args.summary_only:
        output['projects'] = results

    if args.output == '-':
        json.dump(output, sys.stdout, indent=2, default=str)
    else:
        with open(args.output, 'w') as f:
            json.dump(output, f, indent=2, default=str)
        print(f"Written to {args.output}", file=sys.stderr)
