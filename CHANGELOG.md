# DarkNite Changelog

## v19.0 (2026-04-08)
- NUCLEAR REBUILD: 81 categories, all 8,399 items categorized and described
- Every item now has a description (0 empty)
- Every item installable to Claude or Cursor with one click
- Install reads content from disk via IPC (no more 50MB+ data files)
- Dashboard data is lightweight (1.5MB) for fast app startup
- New categories: AI Orchestration, Trading Skills, Washin Patterns, Life Management, Expert Patterns, Code Quality, Claude Code Skills, Thought Leaders, and 70+ more
- Pre-computed categories in data (no more runtime regex matching)
- Sync All loads content on-demand from ~/.claude/ directories
- Copy button loads content on-demand
- Works on Windows and Mac

## v18.0 (2026-04-08)
- Dashboard fully regenerated from all .claude directories (6,502 skills + 931 agents + 966 commands)
- Total: 8,399 capabilities from 30 source repos
- Fixed preload.js to handle const JARVIS_DATA format
- Fixed data.b64 to encode pure JSON (not JS wrapper)
- Auto-updater latest.yml now included in releases
- All Ruflo v3.5 + Claude Code Source capabilities verified in dashboard
- Works on Windows and Mac

## v17.0 (2026-04-08)
- Integrated Ruflo v3.5 (ruvnet/ruflo) - Enterprise AI Orchestration Platform
- Added 148 new skills from Ruflo (21 packages + 80+ agent skills + 47 framework/integration skills)
- Added 20 new agents from Ruflo (coordinator, architect, coder, reviewer, tester, security, SONA, Byzantine, HNSW, etc.)
- Added 26 new commands for Ruflo CLI orchestration
- New source repo: ruvnet/ruflo (SOURCE_REPOS expanded from 29 to 30)
- Total: 8,333 capabilities (6,502 skills, 942 agents, 966 commands)
- Ruflo highlights: Byzantine fault-tolerant swarms, SONA adaptive learning, HNSW vector memory, 9 RL algorithms, multi-LLM providers, WASM governance kernel
- Auto-activate rules added for multi-agent orchestration, agent memory/learning, and MCP integration tasks
- Works on Windows and Mac

## v16.0 (2026-03-31)
- Integrated Claude Code leaked source (dfnine9/claude-code) — 1,884 TypeScript files, 512K+ lines
- Added 87 new skills from Claude Code internals (tools, services, bundled skills)
- Added 13 new agents from Claude Code coordinator and agent systems
- Added 80 new commands from Claude Code slash command system
- New source repo: dfnine9/claude-code (SOURCE_REPOS expanded from 28 to 29)
- Total: 8,139 capabilities (6,354 skills, 922 agents, 940 commands) -- updated counts based on directory scan; some items may have been recategorized or deduplicated from v15
- Includes full Claude Code architecture: QueryEngine, multi-agent coordinator, MCP service, bridge system, plugin architecture, voice input, Vim mode, and more
- Claude Code source preserved at claude-code-source/ for reference
- All items installed to both project and global .claude directories
- Works on Windows and Mac

## v15.0 (2026-03-25)
- Scraped 12 new GitHub repos adding 1,531 new capabilities
- Total: 7,959 capabilities (5,900 skills, 1,038 agents, 1,021 commands)
- New repos: alirezarezvani/claude-skills, rohitg00/awesome-claude-code-toolkit, VoltAgent/awesome-claude-code-subagents, levnikolaevich/claude-code-skills, wshobson/agents, affaan-m/everything-claude-code, davepoon/buildwithclaude, hesreallyhim/awesome-claude-code, sohzm/cheating-daddy
- SOURCE_REPOS expanded from 16 to 28 repos for Update All
- All items deduplicated and sanitized
- Works on Windows and Mac

## v14.0 (2026-03-25)
- Update All now scans 4x more directory patterns per repo (skills/, .claude/skills/, claude/skills/, src/skills/)
- Cleaned update overlay: removed sync buttons, just progress bar + log + close
- Title changed from "Sync Capabilities" to "Update All"
- Total: 6,428 capabilities (4,957 skills, 903 agents, 568 commands)
- Works on Windows and Mac

## v13.2 (2026-03-24)
- Verified working on Windows — all 6,428 capabilities display correctly
- Removed debug DevTools from production build
- Clean release build for Mac and Windows

## v13.1 (2026-03-24)
- **FIXED: Black screen on Windows AND Mac** — app now displays all 6,428 capabilities
- Root cause: missing `categorize()` function + undefined global variables crashed JS before rendering
- Root cause #2: `darknite://` protocol failed, preload crashed (sandbox blocked `require('fs')`)
- Fix: `sandbox: false` in webPreferences allows preload to use Node.js fs
- Fix: `loadFile()` instead of broken custom protocol
- Fix: preload loads dashboard-data.js directly via fs.readFileSync (bulletproof)
- Fix: removed duplicate `let searchTimeout` declaration
- Fix: added 40+ category mappings for skill filtering (AI, Cloud, Security, Frontend, etc)
- Triple data loading: preload fs → data.b64 fallback → empty data safety net
- Unpacked dashboard-data.js from asar for Mac compatibility
- Verified: 4,957 skills, 903 agents, 568 commands all loading correctly

## v13.0 (2026-03-24)
- Added categorize() function and global state variables
- Still had black screen due to protocol/sandbox issues (fixed in v13.1)

## v12.0 (2026-03-23)
- Mac-side fixes: original-fs for asar bypass, data.b64 decoding to temp file
- Updated README with download links
- Preload data loading via Node.js fs

## v11.0 (2026-03-21)
- 54 new skills: AI, Cloud, Security, Frontend, Backend, Data, Mobile, Testing, DevOps, Web3, Architecture
- 12 new agents: AI pair programmer, architecture reviewer, chaos engineer, etc
- 24 new commands: profile-performance, scan-vulnerabilities, scaffold-microservice, etc
- Total: 6,428 capabilities (4,957 skills, 903 agents, 568 commands)
- Base64 data encoding — zero HTML tag contamination, works on Mac and Windows
- 1 script open, 1 script close — guaranteed clean parse everywhere
- Removed duplicate antigravity-awesome-- prefixes from v9.0
- Cleaned up all old releases, single clean GitHub release

## v8.0 (2026-03-20)
- All 7,219 capabilities embedded inline in HTML — no external file loading
- Escaped all `</script>` tags in embedded data for cross-platform compatibility
- Simplified preload.js to pure IPC bridge
- Removed sandbox:false, extraResources, asarUnpack dependencies
- Works on Windows AND Mac — zero external file failures

## v7.0 (2026-03-19)
- Triple data loading: script tag + preload fs + main process injection
- Install verification modal with file counts for Claude and Cursor
- Open Folder buttons to verify installed files in Finder/Explorer
- Usage guide popup after install explaining how to use skills
- Git LFS fix: CI checkout with `lfs: true` for 49MB data file
- Preload uses `new Function()` with multi-path search
- extraResources puts data file at `process.resourcesPath`

## v6.0 (2026-03-19)
- Changed data file to `window._JARVIS_RAW` to avoid const conflicts
- Script tag + preload backup dual loading
- Fixed preload JSON parse (trailing semicolon)

## v5.0 (2026-03-19)
- Sandbox disabled for preload fs access
- Data loaded via Node.js `fs.readFileSync` in preload
- IPC-based data loading as backup
- Increased V8 max-old-space-size to 4GB

## v4.0 (2026-03-19)
- asarUnpack for dashboard-data.js
- V8 memory increase for large data parsing
- Data load verification with error screen fallback

## v3.0 (2026-03-19)
- GPU acceleration: NVIDIA on Windows, Metal on Mac
- Fixed all button labels: Sync to Claude / Sync to Cursor / Sync to Both
- Modal install buttons with 3 targets everywhere
- Update All installs to both Claude + Cursor
- GitHub vet modal with 3 install target buttons
- Auto-update during boot encryption animation
- macOS build: universal zip (Intel + Apple Silicon)
- CI/CD: GitHub Actions builds Win + Mac on tag push
- Platform-specific GPU flags

## v2.0 (2026-03-19)
- Mac and Linux support added
- CI/CD pipeline with GitHub Actions
- Auto-updater via electron-updater
- GitHub repo integration (browse, scan, download from any repo)
- Sync to Claude Code and Cursor
- Boot encryption animation with update status
- Batman Riddler + Batman Forever fonts

## v1.0 (2026-03-19)
- Initial release: 7,219 capabilities (5,862 skills, 853 agents, 504 commands)
- Batman/Batcave dark theme with yellow accents
- Search, filter by category, browse Skills/Agents/Commands tabs
- Install to Claude Code (~/.claude/)
- Portable Windows exe
- Boot encryption animation
- Bruce Wayne CEO profile
