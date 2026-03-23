#!/bin/bash
# JARVIS Installer - Installs all skills, agents, and commands to Claude Code
# Usage: ./install.sh [claude|cursor|both]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="${1:-claude}"

install_to() {
    local dest="$1"
    local label="$2"

    echo "Installing to $dest ($label)..."

    # Skills
    if [ -d "$SCRIPT_DIR/skills" ]; then
        mkdir -p "$dest/skills"
        cp -r "$SCRIPT_DIR/skills/"* "$dest/skills/"
        echo "  Skills: $(ls -d "$SCRIPT_DIR/skills/"*/ 2>/dev/null | wc -l)"
    fi

    # Agents
    if [ -d "$SCRIPT_DIR/agents" ]; then
        mkdir -p "$dest/agents"
        cp "$SCRIPT_DIR/agents/"*.md "$dest/agents/"
        echo "  Agents: $(ls "$SCRIPT_DIR/agents/"*.md 2>/dev/null | wc -l)"
    fi

    # Commands
    if [ -d "$SCRIPT_DIR/commands" ]; then
        mkdir -p "$dest/commands"
        cp "$SCRIPT_DIR/commands/"*.md "$dest/commands/"
        echo "  Commands: $(ls "$SCRIPT_DIR/commands/"*.md 2>/dev/null | wc -l)"
    fi

    echo "  Done!"
}

case "$TARGET" in
    claude)
        install_to "$HOME/.claude" "Claude Code"
        ;;
    cursor)
        install_to "$HOME/.cursor" "Cursor"
        ;;
    both)
        install_to "$HOME/.claude" "Claude Code"
        install_to "$HOME/.cursor" "Cursor"
        ;;
    *)
        echo "Usage: $0 [claude|cursor|both]"
        echo "  claude  - Install to ~/.claude/ (default)"
        echo "  cursor  - Install to ~/.cursor/"
        echo "  both    - Install to both"
        exit 1
        ;;
esac

echo ""
echo "JARVIS installed! Restart your editor to use the new capabilities."
echo "  Skills:   $(ls -d "$SCRIPT_DIR/skills/"*/ 2>/dev/null | wc -l)"
echo "  Agents:   $(ls "$SCRIPT_DIR/agents/"*.md 2>/dev/null | wc -l)"
echo "  Commands: $(ls "$SCRIPT_DIR/commands/"*.md 2>/dev/null | wc -l)"
