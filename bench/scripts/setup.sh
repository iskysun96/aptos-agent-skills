#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BENCH_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$BENCH_DIR")"
CACHE_DIR="${HOME}/.cache/aptos-eval-workspace"

echo "=== Aptos Skill Eval Setup ==="

# 1. Install bench dependencies
echo "Installing bench dependencies..."
cd "$BENCH_DIR"
npm install

# 2. Pre-cache Move workspace (download framework deps once)
echo "Setting up cached Move workspace..."
mkdir -p "$CACHE_DIR/sources"
cp "$BENCH_DIR/fixtures/move-toml/template-Move.toml" "$CACHE_DIR/Move.toml"
cat > "$CACHE_DIR/sources/placeholder.move" << 'MOVE'
module my_addr::placeholder {
    public fun hello(): u64 { 1 }
}
MOVE

# Compile once to cache dependencies
if command -v aptos &> /dev/null; then
    echo "Pre-fetching Aptos framework dependencies (this may take a few minutes)..."
    cd "$CACHE_DIR"
    aptos move compile --skip-fetch-latest-git-deps 2>/dev/null || \
    aptos move compile 2>/dev/null || \
    echo "Warning: Move compilation cache failed. Evals will fetch deps on first run."
    cd "$BENCH_DIR"
else
    echo "Warning: aptos CLI not found. Move compilation assertions will be skipped."
fi

# 3. Build prompts
echo "Building prompts..."
node scripts/build-prompts.js

echo ""
echo "Setup complete! Run 'npm run eval' to execute benchmarks."
echo "Requires ANTHROPIC_API_KEY environment variable."
