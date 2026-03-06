#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BENCH_DIR="$(dirname "$SCRIPT_DIR")"
RESULTS_DIR="$BENCH_DIR/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Parse arguments
MODE="${1:-all}"  # all, move, sdk, skill
SKILL_NAME="${2:-}"
EXTRA_ARGS="${@:3}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

mkdir -p "$RESULTS_DIR"

# Check for API key
if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
    echo -e "${RED}Error: ANTHROPIC_API_KEY not set${NC}"
    echo "Export your Anthropic API key: export ANTHROPIC_API_KEY=sk-..."
    exit 1
fi

# Find configs based on mode
find_configs() {
    case "$MODE" in
        all)
            find "$BENCH_DIR/skills" -name "promptfooconfig.yaml" | sort
            ;;
        move)
            find "$BENCH_DIR/skills/move" -name "promptfooconfig.yaml" | sort
            ;;
        sdk)
            find "$BENCH_DIR/skills/sdk" -name "promptfooconfig.yaml" | sort
            ;;
        skill)
            if [ -z "$SKILL_NAME" ]; then
                echo -e "${RED}Error: skill name required. Usage: npm run eval:skill -- <skill-name>${NC}" >&2
                exit 1
            fi
            find "$BENCH_DIR/skills" -path "*/$SKILL_NAME/promptfooconfig.yaml" | sort
            ;;
        *)
            echo -e "${RED}Unknown mode: $MODE. Use: all, move, sdk, skill${NC}" >&2
            exit 1
            ;;
    esac
}

CONFIGS=$(find_configs)
if [ -z "$CONFIGS" ]; then
    echo -e "${RED}No promptfoo configs found for mode: $MODE${NC}"
    exit 1
fi

TOTAL=$(echo "$CONFIGS" | wc -l | tr -d ' ')
PASSED=0
FAILED=0
ERRORS=0

echo "=== Aptos Skill Eval ==="
echo "Mode: $MODE"
echo "Configs found: $TOTAL"
echo "Results dir: $RESULTS_DIR"
echo ""

for CONFIG in $CONFIGS; do
    SKILL_DIR=$(dirname "$CONFIG")
    SKILL=$(basename "$SKILL_DIR")
    CATEGORY=$(basename "$(dirname "$SKILL_DIR")")
    OUTPUT_FILE="$RESULTS_DIR/${CATEGORY}_${SKILL}_${TIMESTAMP}.json"

    echo -e "${YELLOW}Running: ${CATEGORY}/${SKILL}${NC}"

    if npx promptfoo eval \
        --config "$CONFIG" \
        --output "$OUTPUT_FILE" \
        $EXTRA_ARGS 2>&1; then
        echo -e "${GREEN}  ✓ ${CATEGORY}/${SKILL} passed${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}  ✗ ${CATEGORY}/${SKILL} failed${NC}"
        FAILED=$((FAILED + 1))
    fi
    echo ""
done

# Summary
echo "=== Summary ==="
echo -e "Total: $TOTAL | ${GREEN}Passed: $PASSED${NC} | ${RED}Failed: $FAILED${NC}"

# Copy latest results for easy access
LATEST_DIR="$RESULTS_DIR/latest"
mkdir -p "$LATEST_DIR"
cp "$RESULTS_DIR"/*_${TIMESTAMP}.json "$LATEST_DIR/" 2>/dev/null || true

if [ "$FAILED" -gt 0 ]; then
    exit 1
fi
