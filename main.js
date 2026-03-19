const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');

let mainWindow;

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload path:', preloadPath, 'exists:', fs.existsSync(preloadPath));

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
      contextIsolation: true
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Open dev tools to see errors (remove in production)
  // mainWindow.webContents.openDevTools();
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

// IPC: Install capability to ~/.claude/
ipcMain.handle('install-capability', async (event, { type, id, content }) => {
  try {
    const claudeDir = path.join(os.homedir(), '.claude');
    let destPath;
    if (type === 'skill') {
      const skillDir = path.join(claudeDir, 'skills', id);
      fs.mkdirSync(skillDir, { recursive: true });
      destPath = path.join(skillDir, 'SKILL.md');
    } else if (type === 'agent') {
      fs.mkdirSync(path.join(claudeDir, 'agents'), { recursive: true });
      destPath = path.join(claudeDir, 'agents', id + '.md');
    } else if (type === 'command') {
      const cleanId = id.replace(/^commands\//, '');
      fs.mkdirSync(path.join(claudeDir, 'commands'), { recursive: true });
      destPath = path.join(claudeDir, 'commands', cleanId + '.md');
    } else {
      return { success: false, error: 'Unknown type: ' + type };
    }
    fs.writeFileSync(destPath, content, 'utf8');
    return { success: true, path: destPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
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

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
