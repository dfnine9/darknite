# DarkNite Command Center

**Powered by JARVIS**

A sleek, Batman-themed desktop command center with 7,219+ AI skills, agents, and commands for Claude Code.

## Features

- **5,862 Skills** - From writing to security, DevOps to AI/ML, every domain covered
- **853 Agents** - Expert-level agents for any technology stack
- **504 Commands** - Ready-to-use slash commands for common workflows
- **One-Click Install** - Install any skill/agent/command directly to Claude Code
- **GitHub Integration** - Scan any GitHub repo and download skills with vetting
- **Sync to Claude** - Bulk install all capabilities to your `~/.claude/` directory
- **Update All** - Pull latest versions from source GitHub repos
- **Batcave Boot Sequence** - Encrypted startup animation

## Quick Start

### Download & Run
1. Download `DarkNite-Setup.exe` from [Releases](../../releases)
2. Double-click to run (portable, no install needed)
3. Browse skills, agents, and commands
4. Click **Install** to add any capability to Claude Code

### Build from Source
```bash
git clone https://github.com/YOUR_USERNAME/darknite.git
cd darknite
npm install
npm start        # Run in dev mode
npm run build    # Build portable .exe
```

## Architecture

```
darknite-app/
  main.js           # Electron main process + IPC handlers
  preload.js        # Context bridge for renderer
  src/
    index.html      # Dashboard UI (Batcave theme)
    dashboard-data.js  # All 7,219 capabilities with descriptions
    icon.ico        # Bat logo icon
    icon.png        # Bat logo PNG
    BatmanRiddler-Regular.ttf  # Title font
    batmfa__.ttf    # Batman Forever font
    batmfo__.ttf    # Batman Forever oblique font
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

## Claude Code Integration

DarkNite installs skills to `~/.claude/skills/`, agents to `~/.claude/agents/`, and commands to `~/.claude/commands/`. After installing, restart Claude Code to use them.

## Theme

- Dark Batcave aesthetic with yellow/gold accents
- Batman Riddler font for titles
- Batman Forever font for body text
- Encrypted boot animation sequence
- Yellow glow border

## License

MIT
