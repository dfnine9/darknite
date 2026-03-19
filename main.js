const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');

let mainWindow;

// === GPU ACCELERATION ===
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-accelerated-video-decode');
if (process.platform === 'win32') {
  // Windows-specific flags (NVIDIA 3060 etc.)
  app.commandLine.appendSwitch('enable-hardware-overlays', 'single-fullscreen,single-on-top,underlay');
  app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,VaapiVideoEncoder,CanvasOopRasterization');
  app.commandLine.appendSwitch('enable-accelerated-mjpeg-decode');
} else if (process.platform === 'darwin') {
  // macOS Metal acceleration
  app.commandLine.appendSwitch('enable-features', 'CanvasOopRasterization,Metal');
}

// === AUTO-UPDATER ===
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('checking-for-update', () => {
  console.log('[AutoUpdate] Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('[AutoUpdate] Update available:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'available', version: info.version });
  }
});

autoUpdater.on('update-not-available', () => {
  console.log('[AutoUpdate] App is up to date');
});

autoUpdater.on('download-progress', (progress) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'downloading', percent: Math.round(progress.percent) });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('[AutoUpdate] Update downloaded:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'ready', version: info.version });
    // Only show dialog after boot animation (delay 5s to let boot finish)
    setTimeout(() => {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'DarkNite Update',
        message: `Version ${info.version} is ready to install.`,
        detail: 'The update will be installed when you close the app.',
        buttons: ['Restart Now', 'Later']
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    }, 5000);
  }
});

autoUpdater.on('error', (err) => {
  console.log('[AutoUpdate] Error:', err.message);
});

// IPC: Manual check for app updates
ipcMain.handle('check-for-app-update', async () => {
  try {
    autoUpdater.checkForUpdates();
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// IPC: Get current app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#000000',
    title: 'DarkNite - Powered by JARVIS',
    icon: path.join(__dirname, 'src', 'icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
      offscreen: false
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
}

// HTTPS GET with redirect following
function httpGet(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const options = { headers: { 'User-Agent': 'DarkNite/1.0', 'Accept': 'application/json' }, ...opts };
    https.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
        return httpGet(res.headers.location, opts).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

// Helper: install to a specific base directory
function installToDir(baseDir, type, id, content) {
  let destPath;
  if (type === 'skill') {
    const skillDir = path.join(baseDir, 'skills', id);
    fs.mkdirSync(skillDir, { recursive: true });
    destPath = path.join(skillDir, 'SKILL.md');
  } else if (type === 'agent') {
    fs.mkdirSync(path.join(baseDir, 'agents'), { recursive: true });
    destPath = path.join(baseDir, 'agents', id + '.md');
  } else if (type === 'command') {
    const cleanId = id.replace(/^commands\//, '');
    fs.mkdirSync(path.join(baseDir, 'commands'), { recursive: true });
    destPath = path.join(baseDir, 'commands', cleanId + '.md');
  } else {
    throw new Error('Unknown type: ' + type);
  }
  fs.writeFileSync(destPath, content, 'utf8');
  return destPath;
}

// IPC: Install capability (supports target: 'claude', 'cursor', 'both')
ipcMain.handle('install-capability', async (event, { type, id, content, target }) => {
  try {
    const results = [];
    const targets = target === 'both' ? ['claude', 'cursor'] : [target || 'claude'];

    for (const t of targets) {
      const baseDir = t === 'cursor'
        ? path.join(os.homedir(), '.cursor')
        : path.join(os.homedir(), '.claude');
      try {
        const destPath = installToDir(baseDir, type, id, content);
        results.push({ target: t, success: true, path: destPath });
      } catch (err) {
        results.push({ target: t, success: false, error: err.message });
      }
    }
    return { success: results.every(r => r.success), results };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC: Detect which editors are installed
ipcMain.handle('detect-editors', async () => {
  const home = os.homedir();
  const editors = [];
  if (fs.existsSync(path.join(home, '.claude')) || true) {
    editors.push({ id: 'claude', name: 'Claude Code', dir: path.join(home, '.claude'), installed: true });
  }
  const cursorDir = path.join(home, '.cursor');
  const cursorExists = fs.existsSync(cursorDir);
  editors.push({ id: 'cursor', name: 'Cursor', dir: cursorDir, installed: cursorExists });
  return editors;
});

// IPC: Scan a GitHub repo
ipcMain.handle('github-scan-repo', async (event, repoUrl) => {
  try {
    const match = repoUrl.match(/(?:github\.com\/)?([^\/\s]+)\/([^\/\s]+)/);
    if (!match) return { success: false, error: 'Invalid format. Use owner/repo or GitHub URL.' };
    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');
    const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
    const items = [];

    async function scanDir(dirPath, type, isSkill) {
      try {
        const res = await httpGet(`${apiBase}/contents/${dirPath}`);
        if (res.status !== 200) return;
        const tree = JSON.parse(res.data);
        if (!Array.isArray(tree)) return;
        for (const entry of tree) {
          if (isSkill && entry.type === 'dir') {
            items.push({ id: entry.name, type, path: entry.path + '/SKILL.md', repo: `${owner}/${repo}` });
          } else if (!isSkill && entry.name.endsWith('.md')) {
            items.push({ id: entry.name.replace('.md',''), type, path: entry.path, repo: `${owner}/${repo}` });
          }
        }
      } catch(e) {}
    }

    await scanDir('.claude/skills', 'skill', true);
    await scanDir('.claude/agents', 'agent', false);
    await scanDir('.claude/commands', 'command', false);

    return { success: true, items, repo: `${owner}/${repo}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC: Fetch a single file from GitHub
ipcMain.handle('github-fetch-file', async (event, { owner, repo, filePath }) => {
  try {
    for (const branch of ['main', 'master']) {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
      const res = await httpGet(url, { headers: { 'User-Agent': 'DarkNite/1.0', 'Accept': 'text/plain' } });
      if (res.status === 200 && !res.data.includes('<!DOCTYPE')) {
        return { success: true, content: res.data };
      }
    }
    return { success: false, error: 'File not found on main or master branch' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  createWindow();
  // Check for updates immediately during boot animation (not after)
  autoUpdater.checkForUpdates().catch(() => {});
});
app.on('window-all-closed', () => app.quit());
