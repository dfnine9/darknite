# DarkNite Changelog

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
