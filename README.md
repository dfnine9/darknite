# DarkNite Command Center

**Powered by JARVIS**

A sleek, Batman-themed desktop command center with 8,333+ AI skills, agents, and commands for Claude Code and Cursor.

---

## Download v17.0.0

| Platform | Download | Notes |
|----------|----------|-------|
| **Windows** | [DarkNite-Installer-17.0.0.exe](../../releases/download/v17.0.0/DarkNite-Installer-17.0.0.exe) | One-click installer |
| **Windows (Portable)** | [DarkNite-17.0.0.exe](../../releases/download/v17.0.0/DarkNite-17.0.0.exe) | No install needed, just run |
| **macOS** | [DarkNite-17.0.0-mac.zip](../../releases/download/v17.0.0/DarkNite-17.0.0-mac.zip) | Universal (Intel + Apple Silicon) |

> **macOS users:** After downloading, unzip and drag DarkNite to Applications. If macOS blocks it, go to **System Settings > Privacy & Security** and click **Open Anyway**.

[View all releases](../../releases)

---

## Features

- **6,502 Skills** - From writing to security, DevOps to AI/ML, every domain covered
- **942 Agents** - Expert-level agents for any technology stack
- **966 Commands** - Ready-to-use slash commands for common workflows
- **One-Click Install** - Install any skill/agent/command directly to Claude Code or Cursor
- **GitHub Integration** - Scan any GitHub repo and download skills with vetting
- **Sync to Claude** - Bulk install all capabilities to your `~/.claude/` directory
- **Update All** - Pull latest versions from 30 source GitHub repos
- **Auto-Update** - App checks for new versions on launch and updates itself
- **Batcave Boot Sequence** - Encrypted startup animation

## Quick Start

1. Download DarkNite for your platform from the table above
2. Run it
3. Browse skills, agents, and commands
4. Click **Install** to add any capability to Claude Code or Cursor

### Build from Source
```bash
git clone https://github.com/dfnine9/darknite.git
cd darknite
npm install
npm start            # Run in dev mode
npm run build        # Build Windows installer + portable
npm run build-mac    # Build macOS zip
npm run build-all    # Build all platforms
```

## Architecture

```
darknite/
  main.js           # Electron main process + IPC handlers
  preload.js        # Context bridge for renderer
  src/
    index.html      # Dashboard UI (Batcave theme)
    data.b64        # All 8,333 capabilities (base64-encoded)
    icon.ico        # Bat logo icon (Windows)
    icon.png        # Bat logo PNG (macOS/Linux)
```

## Source Repositories (30)

Capabilities are curated from 30 GitHub repositories including:
- **Claude Code Source** (dfnine9/claude-code) - 1,884 TypeScript files from the Claude Code CLI
- **Ruflo v3.5** (ruvnet/ruflo) - Enterprise AI orchestration with Byzantine fault tolerance, SONA learning, HNSW vector memory
- **wshobson/agents** - 170+ specialized agents
- And 27 more curated repos (see CHANGELOG for full list)

## Categories

| Category | Count |
|----------|-------|
| AI & Machine Learning | 500+ |
| Security & Pentesting | 400+ |
| Web Development | 500+ |
| DevOps & Cloud | 450+ |
| Data Engineering | 350+ |
| Mobile Development | 200+ |
| Blockchain & Web3 | 150+ |
| Business & Marketing | 350+ |
| Claude Code Internals | 180 |
| Ruflo Orchestration | 194 |
| And 40+ more categories... | |

## Claude Code / Cursor Integration

DarkNite installs skills to `~/.claude/skills/`, agents to `~/.claude/agents/`, and commands to `~/.claude/commands/`. Works with both Claude Code and Cursor. After installing, restart your editor to use them.

## What's New

### v17.0.0 (2026-04-08)
- Integrated **Ruflo v3.5** (ruvnet/ruflo) - Enterprise AI Orchestration Platform
- 148 new skills, 20 new agents, 26 new commands from Ruflo
- Byzantine fault-tolerant swarms, SONA adaptive learning, 9 RL algorithms
- HNSW vector memory, multi-LLM providers, WASM governance kernel
- Total: 8,333 capabilities across 30 source repos

### v16.0.0 (2026-03-31)
- Integrated **Claude Code source** (dfnine9/claude-code) - 1,884 TypeScript files
- 87 new skills, 13 new agents, 80 new commands from Claude Code internals
- QueryEngine, multi-agent coordinator, MCP service, bridge system, plugin architecture

### v15.0.0 (2026-03-25)
- Scraped 12 new GitHub repos adding 1,531 new capabilities
- SOURCE_REPOS expanded from 16 to 28

[Full changelog](CHANGELOG.md)

## License

MIT
