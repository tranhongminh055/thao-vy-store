const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : 'true';
    opts[key] = value;
  }
}

function exitWithHelp() {
  console.log(`\nUsage:`);
  console.log(`  node scripts/sitemap-graph.js --url <site-url> --output sitemap.xml`);
  console.log(`  node scripts/sitemap-graph.js --from sitemap.xml --dot sitemap.dot --html sitemap.html`);
  console.log(`  node scripts/sitemap-graph.js --localDir . --baseUrl https://thao-vy-store.web.app --output sitemap.xml`);
  console.log(`  node scripts/sitemap-graph.js --url <site-url> --output sitemap.xml --dot sitemap.dot --html sitemap.html`);
  console.log(`\nOptions:`);
  console.log(`  --url      URL để crawl và tạo sitemap`);
  console.log(`  --localDir  Folder local chứa các file HTML để tạo sitemap từ source`);
  console.log(`  --baseUrl   URL gốc khi tạo sitemap từ local directory`);
  console.log(`  --output   Tên file sitemap xuất ra`);
  console.log(`  --from     File sitemap.xml để chuyển thành graph`);
  console.log(`  --dot      File Graphviz DOT xuất ra`);
  console.log(`  --html     File HTML visual đơn giản xuất ra`);
  process.exit(1);
}

async function crawlSite(url, output) {
  const outputPath = path.resolve(output);
  console.log(`Crawling ${url} → ${outputPath}`);
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['sitemap-generator-cli', url, '--output', outputPath], {
      stdio: 'inherit',
      shell: true,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`sitemap-generator-cli exited with code ${code}`));
      }
    });
    proc.on('error', (err) => reject(err));
  });
}

function readSitemap(file) {
  const contents = fs.readFileSync(path.resolve(file), 'utf8');
  const urls = [];
  const matcher = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = matcher.exec(contents))) {
    urls.push(match[1].trim());
  }
  return urls;
}

function gatherHtmlFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === '.firebase' || entry.name === '.git') {
      continue;
    }
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...gatherHtmlFiles(entryPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      results.push(entryPath);
    }
  }
  return results;
}

function normalizeLocalUrl(filePath, rootDir, baseUrl) {
  let relative = path.relative(rootDir, filePath).split(path.sep).join('/');
  relative = relative.replace(/index\.html$/i, '');
  if (!relative.startsWith('/')) {
    relative = '/' + relative;
  }
  if (relative.endsWith('/')) {
    relative = relative.slice(0, -1) || '/';
  }
  return `${baseUrl.replace(/\/+$/, '')}${relative}`;
}

function generateLocalSitemap(directory, baseUrl, output) {
  const rootDir = path.resolve(directory);
  const files = gatherHtmlFiles(rootDir);
  const urls = files.map((file) => normalizeLocalUrl(file, rootDir, baseUrl));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>`)
    .join('\n')}\n</urlset>\n`;
  const outputPath = path.resolve(output);
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`Đã tạo sitemap local: ${outputPath}`);
  return outputPath;
}

function buildTree(urls) {
  const tree = { name: 'ROOT', children: new Map() };
  urls.forEach((url) => {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    let node = tree;
    segments.forEach((segment) => {
      if (!node.children.has(segment)) {
        node.children.set(segment, { name: segment, children: new Map() });
      }
      node = node.children.get(segment);
    });
  });
  return tree;
}

function dotSafe(label) {
  return JSON.stringify(label);
}

function treeToDot(tree, graphName = 'Sitemap') {
  const lines = ['digraph Sitemap {', '  node [shape=box, style=rounded, color="#333333"];'];

  function traverse(node, parentId) {
    const id = `${Math.random().toString(36).slice(2)}_${node.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
    lines.push(`  ${id} [label=${dotSafe(node.name)}];`);
    if (parentId) {
      lines.push(`  ${parentId} -> ${id};`);
    }
    node.children.forEach((child) => traverse(child, id));
  }

  traverse(tree, null);
  lines.push('}');
  return lines.join('\n');
}

function treeToHtml(tree) {
  function render(node) {
    if (node.children.size === 0) {
      return `<li><span>${escapeHtml(node.name)}</span></li>`;
    }
    return `<li><span>${escapeHtml(node.name)}</span><ul>${[...node.children.values()].map(render).join('')}</ul></li>`;
  }

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Sitemap Diagram</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 24px; background: #f5f7fb; color: #222; }
    h1 { margin-bottom: 4px; }
    p { margin-top: 0; color: #555; }
    .tree { display: flex; justify-content: center; padding: 24px 0; overflow-x: auto; }
    .tree ul {
      padding-top: 20px; position: relative;
      transition: all 0.5s;
      white-space: nowrap;
    }
    .tree li {
      display: inline-block;
      vertical-align: top;
      text-align: center;
      list-style-type: none;
      padding: 20px 10px 0 10px;
      position: relative;
    }
    .tree li::before, .tree li::after {
      content: '';
      position: absolute;
      top: 0;
      right: 50%;
      border-top: 1px solid #bbb;
      width: 50%;
      height: 20px;
    }
    .tree li::after {
      right: auto;
      left: 50%;
      border-left: 1px solid #bbb;
    }
    .tree li:only-child::after, .tree li:only-child::before {
      display: none;
    }
    .tree li:only-child { padding-top: 0; }
    .tree li:first-child::before, .tree li:last-child::after {
      border: 0 none;
    }
    .tree li span {
      border: 1px solid #bbb;
      padding: 8px 12px;
      border-radius: 6px;
      display: inline-block;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      font-size: 0.95rem;
      max-width: 180px;
      word-break: break-word;
    }
    .tree li ul {
      padding-top: 20px;
    }
    .tree li ul::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      border-left: 1px solid #bbb;
      width: 0;
      height: 20px;
    }
    .footer { margin-top: 24px; color: #666; font-size: 0.9rem; }
  </style>
</head>
<body>
  <h1>Sitemap Diagram</h1>
  <p>Hiển thị cây sitemap thành sơ đồ.</p>
  <div class="tree">
    <ul>
      ${render(tree)}
    </ul>
  </div>
  <div class="footer">Mở file này trong trình duyệt để xem sơ đồ sitemap.</div>
</body>
</html>`;
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

(async () => {
  if (!opts.url && !opts.from && !opts.localDir) {
    exitWithHelp();
  }

  let sitemapPath = opts.from;

  try {
    if (opts.url) {
      if (!opts.output) {
        console.error('Thiếu option --output để lưu sitemap');
        process.exit(1);
      }
      sitemapPath = await crawlSite(opts.url, opts.output);
    }

    if (opts.localDir) {
      if (!opts.output) {
        console.error('Thiếu option --output để lưu sitemap local');
        process.exit(1);
      }
      const baseUrl = opts.baseUrl || 'https://thao-vy-store.web.app';
      sitemapPath = generateLocalSitemap(opts.localDir, baseUrl, opts.output);
    }

    if (opts.from || opts.dot || opts.html) {
      if (!sitemapPath) {
        console.error('Không có file sitemap để chuyển thành graph. Dùng --from hoặc --url + --output hoặc --localDir + --output.');
        process.exit(1);
      }
      const urls = readSitemap(sitemapPath);
      if (urls.length === 0) {
        console.error('Không tìm thấy URL trong sitemap:', sitemapPath);
        process.exit(1);
      }
      const tree = buildTree(urls);

      if (opts.dot) {
        const dotPath = path.resolve(opts.dot);
        fs.writeFileSync(dotPath, treeToDot(tree), 'utf8');
        console.log(`Đã tạo Graphviz DOT: ${dotPath}`);
      }

      if (opts.html) {
        const htmlPath = path.resolve(opts.html);
        fs.writeFileSync(htmlPath, treeToHtml(tree), 'utf8');
        console.log(`Đã tạo HTML sitemap graph: ${htmlPath}`);
      }
    }

    if (!opts.url && opts.from && !opts.dot && !opts.html) {
      console.log('Không có output graph nào được yêu cầu. Dùng --dot và/hoặc --html.');
    }
  } catch (error) {
    console.error('Lỗi:', error.message || error);
    process.exit(1);
  }
})();
