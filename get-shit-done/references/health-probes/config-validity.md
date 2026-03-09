---
probe_id: config-validity
category: Config Validity
tier: default
dimension: infrastructure
execution: inline
depends_on: []
---

# Config Validity Probe

Validates `.planning/config.json` structure and required fields.

## Checks

### CFG-01: Config file exists

```bash
CONFIG=".planning/config.json"

test -f "$CONFIG" && echo "PASS" || echo "FAIL"
```

**blocks:** [CFG-02, CFG-03, CFG-04, CFG-05, CFG-06]

### CFG-02: JSON is parseable

```bash
node -e "JSON.parse(require('fs').readFileSync('$CONFIG','utf8'))" 2>/dev/null && echo "PASS" || echo "FAIL"
```

**blocks:** [CFG-03, CFG-04, CFG-05, CFG-06]

### CFG-03: Required fields present

```bash
for field in mode depth; do
  node -e "const c=JSON.parse(require('fs').readFileSync('$CONFIG','utf8')); if(!c.$field) process.exit(1)" 2>/dev/null && echo "PASS: $field present" || echo "FAIL: $field missing"
done
```

### CFG-04: Field values valid

```bash
MODE=$(node -e "const c=JSON.parse(require('fs').readFileSync('$CONFIG','utf8')); console.log(c.mode||'')" 2>/dev/null)
DEPTH=$(node -e "const c=JSON.parse(require('fs').readFileSync('$CONFIG','utf8')); console.log(c.depth||'')" 2>/dev/null)
echo "$MODE" | grep -qE "^(yolo|interactive)$" && echo "PASS: mode=$MODE" || echo "WARNING: mode=$MODE is not yolo|interactive"
echo "$DEPTH" | grep -qE "^(quick|standard|comprehensive)$" && echo "PASS: depth=$DEPTH" || echo "WARNING: depth=$DEPTH is not quick|standard|comprehensive"
```

### CFG-05: Version tracking exists

```bash
node -e "const c=JSON.parse(require('fs').readFileSync('$CONFIG','utf8')); if(!c.gsd_reflect_version) process.exit(1)" 2>/dev/null && echo "PASS" || echo "WARNING: Missing gsd_reflect_version (pre-version-tracking project)"
```

### CFG-06: Health check config exists

```bash
node -e "const c=JSON.parse(require('fs').readFileSync('$CONFIG','utf8')); if(!c.health_check) process.exit(1)" 2>/dev/null && echo "PASS" || echo "WARNING: Missing health_check section (use --fix to add defaults)"
```

## Edge Cases

If `.planning/config.json` does not exist, CFG-01 FAILs and CFG-02 through CFG-06 are skipped. Report "No config found -- run `/gsd:new-project` to initialize."
