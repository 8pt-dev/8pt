#!/usr/bin/env node
// 8pt CLI — search and install 8pt components, templates, themes, icons and Skills.
// Talks to the 8pt MCP endpoint (https://8pt.dev/api/mcp) with your API Key.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { spawn } from "node:child_process";

const VERSION = "0.3.0";
const BASE = (process.env.EIGHTPT_BASE_URL || "https://8pt.dev").replace(/\/+$/, "");
const CONF_DIR = process.env.EIGHTPT_CONFIG_DIR || path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"), "8pt");
const CONF = path.join(CONF_DIR, "config.json");
const KEYS_URL = BASE + "/settings/api-keys/";

process.stdout.on("error", (e) => { if (e.code === "EPIPE") process.exit(0); throw e; });
const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (n) => (s) => (tty ? `\x1b[${n}m${s}\x1b[0m` : String(s));
const dim = c(2), bold = c(1), blue = c(34), green = c(32), red = c(31);

const out = (s = "") => process.stdout.write(s + "\n");
const die = (msg, code = 1) => { process.stderr.write(red("✕ ") + msg + "\n"); process.exit(code); };

/* ---------- args ---------- */
const argv = process.argv.slice(2);
const flags = {}, pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--") { pos.push(...argv.slice(i + 1)); break; }
  if (a.startsWith("--")) {
    const [k, v] = a.slice(2).split(/=(.*)/s);
    if (v !== undefined) flags[k] = v;
    else if (argv[i + 1] && !argv[i + 1].startsWith("-") && ["api-key", "out", "dir", "category", "limit", "target", "client", "only"].includes(k)) flags[k] = argv[++i];
    else flags[k] = true;
  } else if (a === "-h") flags.help = true;
  else if (a === "-v") flags.version = true;
  else if (a === "-y") flags.yes = true;
  else pos.push(a);
}
const json = !!flags.json;

/* ---------- config ---------- */
const readConf = () => { try { return JSON.parse(fs.readFileSync(CONF, "utf8")); } catch { return {}; } };
const writeConf = (o) => { fs.mkdirSync(CONF_DIR, { recursive: true, mode: 0o700 }); fs.writeFileSync(CONF, JSON.stringify(o, null, 2) + "\n", { mode: 0o600 }); };
const apiKey = () => flags["api-key"] || process.env.API_KEY_8PT || process.env.EIGHTPT_API_KEY || readConf().apiKey || "";

/* ---------- MCP ---------- */
let rpcId = 0;
async function rpc(method, params, key = apiKey()) {
  if (!key) die(`还没登录。运行 ${bold("8pt login")}，或用 --api-key / 环境变量 API_KEY_8PT 传入 Key。`);
  let res;
  try {
    res = await fetch(BASE + "/api/mcp", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", authorization: "Bearer " + key, "user-agent": "8pt-cli/" + VERSION },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
    });
  } catch (e) { die("连不上 " + BASE + "：" + e.message); }
  const body = await res.json().catch(() => null);
  if (res.status === 401) die("API Key 无效或已撤销。到 " + KEYS_URL + " 重新创建，再运行 8pt login。");
  if (res.status === 429) die("请求太频繁，稍后再试。");
  if (!body) die("服务器返回 " + res.status);
  if (body.error) die(body.error.message || "请求失败");
  return body.result;
}
async function tool(name, args = {}) {
  const r = await rpc("tools/call", { name, arguments: args });
  const text = (r.content || []).map((x) => x.text || "").join("\n");
  if (r.isError) die(text || "调用失败");
  return text;
}
const parse = (t) => { try { return JSON.parse(t); } catch { return null; } };

/* ---------- helpers ---------- */
const ask = (q) => new Promise((r) => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); rl.question(q, (a) => { rl.close(); r(a.trim()); }); });
function openUrl(u) {
  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", u] : [u];
  try { spawn(cmd, args, { stdio: "ignore", detached: true }).unref(); return true; } catch { return false; }
}
function write(file, content) {
  if (fs.existsSync(file) && !flags.force && !flags.yes) { out(dim("  跳过（已存在，用 --force 覆盖）") + " " + file); return false; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  out(green("  ✓ ") + path.relative(process.cwd(), file));
  return true;
}
const safe = (s) => String(s).toLowerCase().replace(/[^a-z0-9-]/g, "");
function skillDir(slug) {
  const t = flags.target || (fs.existsSync(".codex") && !fs.existsSync(".claude") ? "codex" : "claude");
  const base = flags.dir || { claude: ".claude/skills", codex: ".codex/skills", cursor: ".cursor/skills", agents: ".agents/skills", plain: "skills" }[t] || t;
  return path.join(base, slug);
}

const RULES = `## 8pt 设计规范（本项目的界面必须遵守）

本项目接入了 8pt（https://8pt.dev）。所有网页、落地页、应用界面和 UI 组件都严格按 8pt 的审美来做：

1. 动手做任何界面前，先调用 8pt MCP 的 \`design_ui\`（brief 用用户原话）；没有 MCP 时运行 \`npx @8pt-dev/cli design "<需求>"\`。
2. 页面结构：有匹配的 8pt 整页模板就用（\`get_template\` / \`8pt template <slug>\`），按模板的区块、版式、间距和动效还原，只替换文案、图片和数据。
3. 每个区块都用 8pt 组件实现（\`get_component\` / \`8pt add <slug>\`），保留其结构、尺寸、圆角、阴影、动效和交互，只改内容。
4. 颜色、字体、圆角、阴影只取自一个 8pt 主题（\`get_theme\` / \`8pt theme <slug>\`）的变量，全页统一；间距用 8 的倍数。
5. 不得自创视觉样式，不得混用其他 UI 库的外观，不得用 emoji 当图标；图标只用 8pt 图标。
6. 某个区块 8pt 里确实没有对应素材时，用同类里最接近的 8pt 组件改内容；仍不合适就省略该区块并告诉用户，不要自己画。
7. 用户的明确要求（品牌色、指定布局）优先，其余部分仍按以上规则。

交付前自查：页面上每个区块都能对应到一个 8pt 模板区块或组件 slug，并在回复里附上「区块 → 8pt slug」对照表。`;
const MARK_A = "<!-- 8pt:start -->", MARK_B = "<!-- 8pt:end -->";
function upsertRules(file, body, wrap = true) {
  const block = wrap ? `${MARK_A}\n${body}\n${MARK_B}` : body;
  let cur = ""; try { cur = fs.readFileSync(file, "utf8"); } catch {}
  let next;
  if (!wrap) next = block + "\n";
  else if (cur.includes(MARK_A) && cur.includes(MARK_B)) next = cur.slice(0, cur.indexOf(MARK_A)) + block + cur.slice(cur.indexOf(MARK_B) + MARK_B.length);
  else next = (cur ? cur.replace(/\s*$/, "\n\n") : "") + block + "\n";
  fs.mkdirSync(path.dirname(file) || ".", { recursive: true });
  fs.writeFileSync(file, next);
  out(green("✓ ") + file + dim(cur ? "（已更新）" : "（新建）"));
}

/* ---------- commands ---------- */
const cmds = {
  async login() {
    let key = flags["api-key"] || pos[1] || "";
    if (!key) {
      out(`在浏览器里打开 ${blue(KEYS_URL)}，创建一个 API Key 后粘贴到这里。`);
      if (!flags["no-browser"]) openUrl(KEYS_URL);
      if (!process.stdin.isTTY) die("非交互环境请用 8pt login --api-key <key>");
      key = await ask("API Key: ");
    }
    if (!key.startsWith("8pt_")) die("Key 应以 8pt_ 开头。");
    const r = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "8pt-cli", version: VERSION } }, key);
    writeConf({ ...readConf(), apiKey: key, savedAt: new Date().toISOString() });
    out(green("✓ 已登录 ") + dim(`(${r?.serverInfo?.title || "8pt"}，Key 保存在 ${CONF})`));
  },
  async logout() {
    const c0 = readConf(); delete c0.apiKey; writeConf(c0);
    out(green("✓ 已退出。") + dim(" 如需彻底作废这个 Key，请到 " + KEYS_URL + " 撤销。"));
  },
  async status() {
    const k = apiKey();
    if (!k) { out("未登录。运行 8pt login"); return; }
    await rpc("ping", {});
    out(green("✓ 已登录 ") + dim(k.slice(0, 10) + "…  " + BASE));
  },
  async init() {
    const all = { agents: "AGENTS.md", claude: "CLAUDE.md", cursor: ".cursor/rules/8pt.mdc", copilot: ".github/copilot-instructions.md" };
    const pick = flags.only ? String(flags.only).split(",") : Object.keys(all);
    out(bold("把 8pt 设计规范写进项目") + dim("（重复运行只会更新 8pt 这一段）"));
    for (const k of pick) {
      if (!all[k]) die("--only 可选：" + Object.keys(all).join(","));
      if (k === "cursor") upsertRules(all[k], `---\ndescription: 8pt 设计规范：所有界面严格使用 8pt 的模板、组件和主题\nalwaysApply: true\n---\n\n${RULES}`, false);
      else upsertRules(all[k], RULES);
    }
    if (!apiKey()) out(dim("\n还没登录：运行 8pt login，再用 8pt mcp 接入你的编码工具。"));
    out(dim("\n之后直接说「做一个 xx 官网」，编码助手会先查 8pt 再动手。"));
  },
  async design() {
    const brief = pos.slice(1).join(" "); if (!brief) die("用法：8pt design \"<要做的界面>\"");
    out(await tool("design_ui", { brief }));
  },
  async rules() { out(RULES); },
  async search() {
    const query = pos.slice(1).join(" ");
    const args = { query, limit: Number(flags.limit) || 10 };
    if (flags.category) args.category = flags.category;
    const t = await tool("search_components", args);
    const d = parse(t);
    if (json) return out(d ? JSON.stringify(d.results, null, 2) : t);
    if (!d) return out(t);
    for (const r of d.results) out(`${bold(r.slug.padEnd(28))} ${r.zh || r.name}  ${dim(r.category)}\n${" ".repeat(29)}${dim(r.desc)}`);
    out(dim(`\n安装：8pt add <slug>    看提示词：8pt prompt <slug>`));
  },
  async add() {
    const slug = safe(pos[1] || ""); if (!slug) die("用法：8pt add <slug>");
    const p = await tool("get_component", { slug });
    const dir = flags.out || flags.dir || path.join("components", "8pt", slug);
    const m = p.match(/\nHTML:\n([\s\S]*?)\n\nCSS:\n([\s\S]*?)\n\nJS[^\n]*:\n([\s\S]*)$/);
    out(bold(`8pt 组件 ${slug}`) + dim(" → " + dir));
    write(path.join(dir, "PROMPT.md"), p + "\n");
    if (m) {
      write(path.join(dir, slug + ".html"), m[1].trim() + "\n");
      if (m[2].trim()) write(path.join(dir, slug + ".css"), m[2].trim() + "\n");
      if (m[3].trim()) write(path.join(dir, slug + ".js"), m[3].trim() + "\n\nexport default init;\n");
    }
    out(dim(`\n下一步：让你的编码助手读 ${path.join(dir, "PROMPT.md")}，按里面的步骤接入项目。`));
  },
  async prompt() {
    const kind = pos[1] === "template" ? "get_template" : "get_component";
    const slug = safe(kind === "get_template" ? pos[2] : pos[1]); if (!slug) die("用法：8pt prompt <slug> | 8pt prompt template <slug>");
    out(await tool(kind, { slug }));
  },
  async templates() {
    const d = parse(await tool("list_templates"));
    if (json) return out(JSON.stringify(d, null, 2));
    for (const t of d) out(`${bold(t.slug.padEnd(24))} ${t.name}  ${dim(t.type || "")}\n${" ".repeat(25)}${dim(t.desc)}`);
    out(dim("\n取回：8pt template <slug>"));
  },
  async template() {
    const slug = safe(pos[1] || ""); if (!slug) die("用法：8pt template <slug>");
    const p = await tool("get_template", { slug });
    const dir = flags.out || flags.dir || path.join("templates", "8pt", slug);
    write(path.join(dir, "PROMPT.md"), p + "\n");
    const html = p.match(/(<!doctype html[\s\S]*<\/html>)/i);
    if (html) write(path.join(dir, "index.html"), html[1] + "\n");
  },
  async skills() {
    const d = parse(await tool("list_skills"));
    if (json) return out(JSON.stringify(d, null, 2));
    for (const s of d) out(`${bold(s.slug.padEnd(28))} ${s.name}  ${dim(s.category + (s.access === "pro" ? " · Builder" : ""))}\n${" ".repeat(29)}${dim(s.desc)}`);
    out(dim("\n安装：8pt skill <slug>  [--target claude|codex|cursor|agents]"));
  },
  async skill() {
    let slug = pos[1] === "install" || pos[1] === "add" ? pos[2] : pos[1];
    slug = safe(slug || ""); if (!slug) die("用法：8pt skill <slug>");
    const t = await tool("get_skill", { slug });
    const dir = skillDir(slug);
    const re = /=== 文件：(.+?) ===\n([\s\S]*?)\n=== 结束：\1 ===/g;
    let m, n = 0;
    out(bold(`8pt Skill ${slug}`) + dim(" → " + dir));
    while ((m = re.exec(t))) {
      const rel = path.normalize(m[1]).replace(/^(\.\.(\/|\\|$))+/, "");
      if (path.isAbsolute(rel)) continue;
      write(path.join(dir, rel), m[2] + "\n"); n++;
    }
    if (!n) die("没有拿到文件。");
  },
  async "install-skill"() {
    const dir = skillDir("8pt");
    const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
    const src = fs.readFileSync(path.join(here, "..", "skill", "SKILL.md"), "utf8");
    out(bold("安装 8pt Skill") + dim(" → " + dir));
    write(path.join(dir, "SKILL.md"), src);
    out(dim("\n现在可以直接对编码助手说：用 8pt 找一个定价切换组件装进来。"));
  },
  async theme() {
    const slug = safe(pos[1] || "");
    const t = await tool("get_theme", slug ? { slug } : {});
    if (!slug) { const d = parse(t); if (json || !d) return out(t); for (const x of d) out(`${bold(x.slug.padEnd(20))} ${x.name}`); return out(dim("\n取回：8pt theme <slug> [--out theme.css]")); }
    if (flags.out) { const css = t.slice(t.indexOf("\n\n") + 2); write(flags.out, css + "\n"); } else out(t);
  },
  async icons() {
    const q = pos.slice(1).join(" ");
    const t = await tool("search_icons", { query: q });
    const d = parse(t);
    if (!d) return out(t);
    if (json) return out(JSON.stringify(d, null, 2));
    if (flags.out || flags.dir) { for (const i of d) write(path.join(flags.out || flags.dir, i.name + ".svg"), i.svg + "\n"); return; }
    for (const i of d) out(bold(i.name) + "\n" + dim(i.svg) + "\n");
  },
  async mcp() {
    const client = flags.client || pos[1] || "";
    const k = apiKey() || "<你的 API Key>";
    const url = BASE + "/api/mcp";
    const cfgs = {
      claude: `claude mcp add --transport http 8pt ${url} --header "Authorization: Bearer ${k}"`,
      codex: `# ~/.codex/config.toml\n[mcp_servers.8pt]\nurl = "${url}"\nhttp_headers = { Authorization = "Bearer ${k}" }`,
      cursor: JSON.stringify({ mcpServers: { "8pt": { url, headers: { Authorization: "Bearer " + k } } } }, null, 2),
    };
    if (cfgs[client]) return out(cfgs[client]);
    out(bold("8pt MCP") + "  " + url + "\n");
    for (const [n, v] of Object.entries(cfgs)) out(blue(n) + "\n" + v + "\n");
  },
};
const alias = { find: "search", s: "search", i: "add", install: "add", whoami: "status", template: "template", tpl: "template", icon: "icons", themes: "theme" };

function help() {
  out(`${bold("8pt")} ${dim("v" + VERSION)}  在终端里用 8pt 组件、模板、主题、图标和 Skill

${bold("开始")}
  8pt login                     打开浏览器创建 API Key 并保存到本机
  8pt init                      把 8pt 设计规范写进项目（AGENTS.md、CLAUDE.md、Cursor、Copilot）
  8pt design <需求>             按需求给出 8pt 设计规则、匹配的模板与组件清单
  8pt install-skill             给 Claude Code / Codex 装上 8pt Skill

${bold("组件")}
  8pt search <描述>             搜索组件（中文或英文）
  8pt add <slug>                装进 components/8pt/<slug>/（源码 + 接入提示词）
  8pt prompt <slug>             打印组件的接入提示词

${bold("更多")}
  8pt templates | template <slug>
  8pt skills | skill <slug> [--target claude|codex|cursor|agents]
  8pt theme [slug] [--out theme.css]
  8pt icons <名称> [--out icons/]
  8pt mcp [claude|codex|cursor]  打印 MCP 配置
  8pt status | logout

${bold("选项")}
  --api-key <key>   CI 或脚本里跳过登录（也可设环境变量 API_KEY_8PT）
  --json            输出 JSON      --force   覆盖已存在的文件
`);
}

(async () => {
  if (flags.version) return out(VERSION);
  const name = alias[pos[0]] || pos[0];
  if (!name || flags.help || name === "help") return help();
  const fn = cmds[name];
  if (!fn) { help(); die("未知命令：" + pos[0]); }
  await fn();
})().catch((e) => die(e.message || String(e)));
