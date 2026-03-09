---
probe_id: config-drift
category: Config Drift
tier: full
dimension: infrastructure
execution: inline
depends_on: [config-validity]
---

# Config Drift Probe

Detects when a project config is behind the current template. Only runs with `--full`.

## Checks

### DRIFT-01: Template field coverage

```bash
TEMPLATE="$HOME/.claude/get-shit-done/templates/config.json"
CONFIG=".planning/config.json"

if [ -f "$TEMPLATE" ] && [ -f "$CONFIG" ]; then
  template_fields=$(node -e "const t=JSON.parse(require('fs').readFileSync('$TEMPLATE','utf8')); console.log(Object.keys(t).sort().join('\n'))" 2>/dev/null)
  config_fields=$(node -e "const c=JSON.parse(require('fs').readFileSync('$CONFIG','utf8')); console.log(Object.keys(c).sort().join('\n'))" 2>/dev/null)
  missing=$(comm -23 <(echo "$template_fields") <(echo "$config_fields") 2>/dev/null)
  [ -z "$missing" ] && echo "PASS: All template fields present" || echo "WARNING: Missing fields from template: $missing"
fi
```

### DRIFT-02: Version compatibility

```bash
CONFIG=".planning/config.json"

INSTALLED=$(cat "$HOME/.claude/get-shit-done/VERSION" 2>/dev/null || echo "unknown")
PROJECT=$(node -e "const c=JSON.parse(require('fs').readFileSync('$CONFIG','utf8')); console.log(c.gsd_reflect_version||'none')" 2>/dev/null)
[ "$INSTALLED" = "$PROJECT" ] && echo "PASS: Version $INSTALLED matches" || echo "WARNING: Installed $INSTALLED vs project $PROJECT"
```

## Dependencies

This probe depends on `config-validity` because drift detection requires a valid, parseable config file. If config validity fails, drift checks may produce misleading results.
