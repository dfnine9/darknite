# DarkNite Command Center

**Powered by JARVIS**

A sleek, Batman-themed desktop command center with 7,219+ AI skills, agents, and commands for Claude Code and Cursor.

---

## Download v12.0.0

| Platform | Download | Notes |
|----------|----------|-------|
| **Windows** | [DarkNite-Installer-12.0.0.exe](../../releases/download/v12.0.0/DarkNite-Installer-12.0.0.exe) | One-click installer |
| **Windows (Portable)** | [DarkNite-12.0.0.exe](../../releases/download/v12.0.0/DarkNite-12.0.0.exe) | No install needed, just run |
| **macOS** | [DarkNite-12.0.0-mac.zip](../../releases/download/v12.0.0/DarkNite-12.0.0-mac.zip) | Universal (Intel + Apple Silicon) |

> **macOS users:** After downloading, unzip and drag DarkNite to Applications. If macOS blocks it, go to **System Settings > Privacy & Security** and click **Open Anyway**.

[View all releases](../../releases)

---

## Features

- **5,862 Skills** - From writing to security, DevOps to AI/ML, every domain covered
- **853 Agents** - Expert-level agents for any technology stack
- **504 Commands** - Ready-to-use slash commands for common workflows
- **One-Click Install** - Install any skill/agent/command directly to Claude Code or Cursor
- **GitHub Integration** - Scan any GitHub repo and download skills with vetting
- **Sync to Claude** - Bulk install all capabilities to your `~/.claude/` directory
- **Update All** - Pull latest versions from source GitHub repos
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
    data.b64        # All 7,219 capabilities (base64-encoded)
    icon.ico        # Bat logo icon (Windows)
    icon.png        # Bat logo PNG (macOS/Linux)
```

## Categories

| Category | Count |
|----------|-------|
| AI & Machine Learning | 400+ |
| Security & Pentesting | 350+ |
| Web Development | 500+ |
| DevOps & Cloud | 400+ |
| Data Engineering | 300+ |
| Mobile Development | 200+ |
| Blockchain & Web3 | 150+ |
| Business & Marketing | 300+ |
| And 40+ more categories... | |

## Claude Code / Cursor Integration

DarkNite installs skills to `~/.claude/skills/`, agents to `~/.claude/agents/`, and commands to `~/.claude/commands/`. Works with both Claude Code and Cursor. After installing, restart your editor to use them.

## What's New in v12.0.0

- **macOS fix** - Skills now load reliably on Mac (replaced 52MB inline data with IPC-based loading)
- **Smaller app** - index.html reduced from 52MB to 268KB
- **Cursor support** - Install skills to Cursor alongside Claude Code

## License

MIT
