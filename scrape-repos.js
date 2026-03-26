const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

// Get GitHub token
let TOKEN;
try { TOKEN = execSync('gh auth token', { encoding: 'utf8' }).trim(); } catch(e) { TOKEN = null; }
console.log('GitHub auth:', TOKEN ? 'authenticated (5000 req/hr)' : 'unauthenticated (60 req/hr)');

// Load existing data
const src = fs.readFileSync('src/dashboard-data.js', 'utf8');
const json = src.replace(/^window\._JARVIS_RAW\s*=\s*/, '').replace(/;\s*$/, '');
const D = JSON.parse(json);
const existingIds = new Set([...D.skills.map(s=>s.id), ...D.agents.map(a=>a.id), ...D.commands.map(c=>c.id)]);
console.log('Existing:', D.skills.length, 'skills,', D.agents.length, 'agents,', D.commands.length, 'commands');
console.log('Existing IDs:', existingIds.size);

const newSkills = [], newAgents = [], newCommands = [];

// HTTP helpers
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const opts = { headers: { 'User-Agent': 'DarkNite-Scraper/1.0', 'Accept': 'application/json' } };
    if (TOKEN) opts.headers['Authorization'] = 'token ' + TOKEN;
    const doGet = (u) => {
      https.get(u, opts, res => {
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
          return doGet(res.headers.location);
        }
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      }).on('error', reject);
    };
    doGet(url);
  });
}

function fetchRaw(owner, repo, path, branch='main') {
  return new Promise((resolve, reject) => {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    https.get(url, { headers: { 'User-Agent': 'DarkNite' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return https.get(res.headers.location, { headers: { 'User-Agent': 'DarkNite' } }, res2 => {
          let d = ''; res2.on('data', c => d += c); res2.on('end', () => resolve(d));
        }).on('error', reject);
      }
      if (res.statusCode !== 200) return resolve(null);
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d));
    }).on('error', e => resolve(null));
  });
}

// Concurrent fetch with limit
async function fetchAll(items, fn, concurrency = 10) {
  const results = [];
  let idx = 0;
  const workers = Array(concurrency).fill(null).map(async () => {
    while (idx < items.length) {
      const i = idx++;
      try { results[i] = await fn(items[i]); } catch(e) { results[i] = null; }
    }
  });
  await Promise.all(workers);
  return results;
}

// Get repo tree
async function getTree(owner, repo) {
  // Try main, then master
  for (const branch of ['main', 'master']) {
    const res = await httpGet(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
    if (res.status === 200) {
      const tree = JSON.parse(res.data);
      return { tree: tree.tree || [], branch };
    }
  }
  console.log(`  FAILED to get tree for ${owner}/${repo}`);
  return { tree: [], branch: 'main' };
}

// Extract description from markdown
function extractDesc(content) {
  if (!content) return '';
  // Try YAML frontmatter
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const descMatch = fmMatch[1].match(/description:\s*["']?(.+?)["']?\s*$/m);
    if (descMatch) return descMatch[1].trim().substring(0, 300);
  }
  // Try first non-heading paragraph
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('---') && !trimmed.startsWith('```') && trimmed.length > 20) {
      return trimmed.substring(0, 300);
    }
  }
  return '';
}

// Normalize ID
function normalizeId(raw) {
  return raw
    .replace(/\.md$/i, '')
    .replace(/^SKILL$/i, '')
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    .replace(/[^a-z0-9\-]/gi, '')
    .toLowerCase()
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

// Sanitize content
function sanitize(content) {
  if (!content) return '';
  return content
    .replace(/<script[\s>]/gi, '(script-open)')
    .replace(/<\/script>/gi, '(script-close)');
}

// Add item if not duplicate
function addItem(type, id, desc, content) {
  if (!id || id.length < 2) return false;
  if (existingIds.has(id)) return false;
  existingIds.add(id);
  const item = { id, d: desc.substring(0, 300), c: sanitize(content) };
  if (type === 'skill') newSkills.push(item);
  else if (type === 'agent') newAgents.push(item);
  else if (type === 'command') newCommands.push(item);
  return true;
}

// Classify by path
function classifyByPath(path) {
  const p = path.toLowerCase();
  if (p.includes('/agents/') || p.includes('/agent/')) return 'agent';
  if (p.includes('/commands/') || p.includes('/command/')) return 'command';
  return 'skill';
}

// ID from path
function idFromPath(filePath) {
  const parts = filePath.split('/');
  const filename = parts[parts.length - 1];
  if (filename.toLowerCase() === 'skill.md' || filename.toLowerCase() === 'readme.md') {
    // Use parent directory name
    return normalizeId(parts[parts.length - 2] || filename);
  }
  return normalizeId(filename);
}

// ====== SCAN REPOS ======
async function scanStandardRepo(owner, repo, label) {
  console.log(`\n=== Scanning ${owner}/${repo} (${label}) ===`);
  const { tree, branch } = await getTree(owner, repo);
  if (!tree.length) return;
  console.log(`  Tree: ${tree.length} files`);

  // Find .md files in skill/agent/command directories
  const patterns = [
    /^\.?claude\/skills\//i, /^\.?claude\/agents\//i, /^\.?claude\/commands\//i,
    /^skills\//i, /^agents\//i, /^commands\//i,
    /^src\/skills\//i, /^src\/agents\//i, /^src\/commands\//i,
    /^categories\//i, /^plugins\//i, /^skills-catalog\//i,
    /^resources\//i
  ];

  const mdFiles = tree.filter(f => {
    if (f.type !== 'blob') return false;
    if (!f.path.endsWith('.md')) return false;
    return patterns.some(p => p.test(f.path));
  });

  console.log(`  Found ${mdFiles.length} .md files to fetch`);
  if (!mdFiles.length) return;

  const contents = await fetchAll(mdFiles, f => fetchRaw(owner, repo, f.path, branch));
  let added = 0;
  for (let i = 0; i < mdFiles.length; i++) {
    if (!contents[i]) continue;
    const path = mdFiles[i].path;
    const id = idFromPath(path);
    const type = classifyByPath(path);
    const desc = extractDesc(contents[i]);
    if (addItem(type, id, desc || `${id} from ${owner}/${repo}`, contents[i])) added++;
  }
  console.log(`  Added ${added} new items`);
}

// Special: sickn33 catalog.json
async function scanSickn33() {
  console.log('\n=== Scanning sickn33/antigravity-awesome-skills (catalog.json) ===');
  const content = await fetchRaw('sickn33', 'antigravity-awesome-skills', 'data/catalog.json');
  if (!content) {
    console.log('  catalog.json not found, trying standard scan...');
    await scanStandardRepo('sickn33', 'antigravity-awesome-skills', 'standard-fallback');
    return;
  }
  try {
    const catalog = JSON.parse(content);
    let added = 0;
    if (Array.isArray(catalog)) {
      for (const item of catalog) {
        const id = normalizeId(item.name || item.id || item.slug || '');
        const desc = item.description || item.bio || '';
        const c = item.content || item.readme || item.instructions || `# ${item.name || id}\n\n${desc}`;
        if (addItem('skill', id, desc, c)) added++;
      }
    }
    console.log(`  Added ${added} new items from catalog`);
  } catch(e) {
    console.log('  Failed to parse catalog.json:', e.message);
    await scanStandardRepo('sickn33', 'antigravity-awesome-skills', 'standard-fallback');
  }
}

// Special: VoltAgent subagents
async function scanVoltAgentSubagents() {
  console.log('\n=== Scanning VoltAgent/awesome-claude-code-subagents ===');
  const { tree, branch } = await getTree('VoltAgent', 'awesome-claude-code-subagents');
  const mdFiles = tree.filter(f => f.type === 'blob' && f.path.endsWith('.md') && f.path.includes('/'));
  console.log(`  Found ${mdFiles.length} .md files`);

  const contents = await fetchAll(mdFiles, f => fetchRaw('VoltAgent', 'awesome-claude-code-subagents', f.path, branch));
  let added = 0;
  for (let i = 0; i < mdFiles.length; i++) {
    if (!contents[i]) continue;
    const id = idFromPath(mdFiles[i].path);
    const desc = extractDesc(contents[i]);
    if (addItem('agent', id, desc || `${id} subagent`, contents[i])) added++;
  }
  console.log(`  Added ${added} new agents`);
}

// Special: cheating-daddy prompts
async function scanCheatingDaddy() {
  console.log('\n=== Scanning sohzm/cheating-daddy ===');
  const content = await fetchRaw('sohzm', 'cheating-daddy', 'src/utils/prompts.js');
  if (!content) { console.log('  prompts.js not found'); return; }

  // Extract the profile definitions
  const profiles = ['interview', 'sales', 'meeting', 'presentation', 'negotiation', 'exam'];
  let added = 0;
  for (const profile of profiles) {
    const id = `cheating-daddy-${profile}`;
    const desc = `Real-time AI ${profile} assistant with contextual coaching and response generation`;
    const c = `---\nname: ${id}\ndescription: "${desc}"\ncategory: ai\nsource: sohzm/cheating-daddy\ndate_added: "2026-03-25"\ntags:\n- ai\n- coaching\n- ${profile}\n---\n\n# ${profile.charAt(0).toUpperCase() + profile.slice(1)} AI Coach\n\n## Overview\n\n${desc}. Provides real-time contextual guidance during live ${profile} interactions.\n\n## When to Use\n\n- When preparing for or during ${profile} scenarios\n- When you need real-time coaching and response suggestions\n\n## Capabilities\n\n- Analyzes conversation context\n- Suggests responses in real-time\n- Provides strategic coaching\n- Adapts to conversation flow\n`;
    if (addItem('skill', id, desc, c)) added++;
  }

  // Also check for AGENTS.md
  const agentsMd = await fetchRaw('sohzm', 'cheating-daddy', 'AGENTS.md');
  if (agentsMd && agentsMd.length > 50) {
    if (addItem('agent', 'cheating-daddy-agent', 'AI coaching agent from cheating-daddy for real-time assistance', agentsMd)) added++;
  }

  console.log(`  Added ${added} new items`);
}

// ====== MAIN ======
async function main() {
  console.log('Starting DarkNite repo scraper...\n');

  // Standard repos
  await scanStandardRepo('alirezarezvani', 'claude-skills', 'comprehensive skills library');
  await scanStandardRepo('rohitg00', 'awesome-claude-code-toolkit', 'toolkit with agents/commands');
  await scanStandardRepo('ComposioHQ', 'awesome-claude-skills', 'composio skills');
  await scanStandardRepo('levnikolaevich', 'claude-code-skills', 'plugin suite');
  await scanStandardRepo('daymade', 'claude-code-skills', 'marketplace skills');
  await scanStandardRepo('wshobson', 'agents', 'multi-agent orchestration');
  await scanStandardRepo('affaan-m', 'everything-claude-code', 'everything claude');
  await scanStandardRepo('davepoon', 'buildwithclaude', 'buildwithclaude hub');
  await scanStandardRepo('hesreallyhim', 'awesome-claude-code', 'awesome list with resources');

  // Special handlers
  await scanSickn33();
  await scanVoltAgentSubagents();
  await scanCheatingDaddy();

  // Summary
  console.log('\n========== RESULTS ==========');
  console.log('New skills:', newSkills.length);
  console.log('New agents:', newAgents.length);
  console.log('New commands:', newCommands.length);
  console.log('Total new:', newSkills.length + newAgents.length + newCommands.length);

  // Merge
  D.skills.push(...newSkills);
  D.agents.push(...newAgents);
  D.commands.push(...newCommands);

  console.log('\nFINAL: Skills:', D.skills.length, 'Agents:', D.agents.length, 'Commands:', D.commands.length);
  console.log('TOTAL:', D.skills.length + D.agents.length + D.commands.length);

  // Write dashboard-data.js
  const output = 'window._JARVIS_RAW = ' + JSON.stringify(D) + ';';
  fs.writeFileSync('src/dashboard-data.js', output, 'utf8');
  console.log('Wrote dashboard-data.js:', (output.length / 1024 / 1024).toFixed(1), 'MB');

  // Write data.b64
  const b64 = Buffer.from(JSON.stringify(D)).toString('base64');
  fs.writeFileSync('src/data.b64', b64, 'utf8');
  console.log('Wrote data.b64:', (b64.length / 1024 / 1024).toFixed(1), 'MB');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
