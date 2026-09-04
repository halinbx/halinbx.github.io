"use strict";

const main = document.getElementById("main");
const TOOLS = [];

function tool(id, name, render, kw) { TOOLS.push({ id: id, name: name, render: render, kw: kw || "" }); }
var onCleanup = [];
function h(html) {
  onCleanup.forEach(function (fn) { try { fn(); } catch (e) {} });
  onCleanup = [];
  main.innerHTML = html;
  main.classList.remove("fadein");
  void main.offsetWidth;
  main.classList.add("fadein");
}
function q(sel) { return document.querySelector(sel); }
function p2(n) { return String(n).padStart(2, "0"); }
function esc(s) {
  return String(s).replace(/[&<>]/g, function (c) {
    return { "&": "&" + "amp;", "<": "&" + "lt;", ">": "&" + "gt;" }[c];
  });
}
function copyText(txt, btn) {
  function fallback() {
    var ta = document.createElement("textarea");
    ta.value = txt;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }
  function done(ok) {
    if (!btn) { toast(ok ? "✓ 已复制" : "复制失败"); return; }
    var old = btn.textContent;
    btn.textContent = ok ? "✓ 已复制" : "复制失败";
    setTimeout(function () { btn.textContent = old; }, 1200);
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(txt)
      .then(function () { done(true); },
            function () { fallback(); done(true); });
  } else {
    fallback();
    done(true);
  }
}
function copyOut(ev, id) {
  var el = document.getElementById(id || "out");
  var btn = ev && ev.target ? ev.target : null;
  copyText(el ? el.innerText : "", btn);
}
var toastTimer = null;
function toast(msg) {
  var t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1400);
}

// ---- 纯 JS 哈希实现(不依赖 Web Crypto,http 环境也可用) ----
function md5(msg) {
  function rl(x, c) { return ((x << c) | (x >>> (32 - c))) >>> 0; }
  var K = [];
  for (var i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
  var S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
           5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
           4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
           6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  var l = msg.length;
  var total = Math.ceil((l + 9) / 64) * 64;
  var m = new Uint8Array(total);
  m.set(msg);
  m[l] = 0x80;
  var dv = new DataView(m.buffer);
  dv.setUint32(total - 8, (l * 8) >>> 0, true);
  dv.setUint32(total - 4, Math.floor(l / 536870912), true);
  var H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  var w = new Uint32Array(16);
  for (var blk = 0; blk < total; blk += 64) {
    for (var j = 0; j < 16; j++) w[j] = dv.getUint32(blk + j * 4, true);
    var a = H[0], b = H[1], c = H[2], d = H[3];
    for (var t = 0; t < 64; t++) {
      var F, g;
      if (t < 16) { F = (b & c) | (~b & d); g = t; }
      else if (t < 32) { F = (d & b) | (~d & c); g = (5 * t + 1) % 16; }
      else if (t < 48) { F = b ^ c ^ d; g = (3 * t + 5) % 16; }
      else { F = c ^ (b | ~d); g = (7 * t) % 16; }
      F = (F + a + K[t] + w[g]) >>> 0;
      a = d; d = c; c = b;
      b = (b + rl(F, S[t])) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
  }
  var out = "";
  for (var k = 0; k < 4; k++)
    for (var bi = 0; bi < 4; bi++) out += ((H[k] >>> (bi * 8)) & 0xff).toString(16).padStart(2, "0");
  return out;
}
var ROTL32 = function (x, n) { return ((x << n) | (x >>> (32 - n))) >>> 0; };
var ROTR32 = function (x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0; };
var HEX8 = function (x) { return ("00000000" + (x >>> 0).toString(16)).slice(-8); };
function pad64B(msg) {
  var l = msg.length;
  var blocks = Math.ceil((l + 9) / 64);
  var total = blocks * 64;
  var m = new Uint8Array(total);
  m.set(msg);
  m[l] = 0x80;
  var dv = new DataView(m.buffer);
  dv.setUint32(total - 8, Math.floor(l / 536870912));
  dv.setUint32(total - 4, (l * 8) >>> 0);
  return { dv: dv, blocks: blocks };
}
function sha1(msg) {
  var p = pad64B(msg);
  var h = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
  var w = new Uint32Array(80);
  for (var i = 0; i < p.blocks; i++) {
    for (var j = 0; j < 16; j++) w[j] = p.dv.getUint32(i * 64 + j * 4);
    for (var j2 = 16; j2 < 80; j2++) w[j2] = ROTL32(w[j2 - 3] ^ w[j2 - 8] ^ w[j2 - 14] ^ w[j2 - 16], 1);
    var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4];
    for (var j3 = 0; j3 < 80; j3++) {
      var f, k;
      if (j3 < 20) { f = (b & c) | (~b & d); k = 0x5A827999; }
      else if (j3 < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
      else if (j3 < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
      else { f = b ^ c ^ d; k = 0xCA62C1D6; }
      var t = (ROTL32(a, 5) + f + e + k + w[j3]) >>> 0;
      e = d; d = c; c = ROTL32(b, 30); b = a; a = t;
    }
    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0; h[4] = (h[4] + e) >>> 0;
  }
  return h.map(HEX8).join("");
}
function sha256(msg) {
  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  var p = pad64B(msg);
  var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  var w = new Uint32Array(64);
  for (var i = 0; i < p.blocks; i++) {
    for (var j = 0; j < 16; j++) w[j] = p.dv.getUint32(i * 64 + j * 4);
    for (var j2 = 16; j2 < 64; j2++) {
      var s0 = ROTR32(w[j2 - 15], 7) ^ ROTR32(w[j2 - 15], 18) ^ (w[j2 - 15] >>> 3);
      var s1 = ROTR32(w[j2 - 2], 17) ^ ROTR32(w[j2 - 2], 19) ^ (w[j2 - 2] >>> 10);
      w[j2] = (w[j2 - 16] + s0 + w[j2 - 7] + s1) >>> 0;
    }
    var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], hh = H[7];
    for (var j3 = 0; j3 < 64; j3++) {
      var S1 = ROTR32(e, 6) ^ ROTR32(e, 11) ^ ROTR32(e, 25);
      var ch = (e & f) ^ (~e & g);
      var t1 = (hh + S1 + ch + K[j3] + w[j3]) >>> 0;
      var S0 = ROTR32(a, 2) ^ ROTR32(a, 13) ^ ROTR32(a, 22);
      var maj = (a & b) ^ (a & c) ^ (b & c);
      var t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + hh) >>> 0;
  }
  return H.map(HEX8).join("");
}
var M64 = (1n << 64n) - 1n;
function rotr64(x, n) { return ((x >> n) | (x << (64n - n))) & M64; }
function pad128(msg) {
  var l = msg.length;
  var blocks = Math.ceil((l + 17) / 128);
  var total = blocks * 128;
  var m = new Uint8Array(total);
  m.set(msg);
  m[l] = 0x80;
  var dv = new DataView(m.buffer);
  var bits = l * 8;
  dv.setUint32(total - 8, Math.floor(bits / 4294967296));
  dv.setUint32(total - 4, bits >>> 0);
  return { dv: dv, blocks: blocks };
}
function sha512(msg) {
  var K = [
    0x428a2f98d728ae22n, 0x7137449123ef65cdn, 0xb5c0fbcfec4d3b2fn, 0xe9b5dba58189dbbcn,
    0x3956c25bf348b538n, 0x591111f1b605d019n, 0x923f82a4af194f9bn, 0xab1c5ed5da6d8118n,
    0xd807aa98a3030242n, 0x12835b0145706fben, 0x243185be4ee4b28cn, 0x550c7dc3d5ffb4e2n,
    0x72be5d74f27b896fn, 0x80deb1fe3b1696b1n, 0x9bdc06a725c71235n, 0xc19bf174cf692694n,
    0xe49b69c19ef14ad2n, 0xefbe4786384f25e3n, 0x0fc19dc68b8cd5b5n, 0x240ca1cc77ac9c65n,
    0x2de92c6f592b0275n, 0x4a7484aa6ea6e483n, 0x5cb0a9dcbd41fbd4n, 0x76f988da831153b5n,
    0x983e5152ee66dfabn, 0xa831c66d2db43210n, 0xb00327c898fb213fn, 0xbf597fc7beef0ee4n,
    0xc6e00bf33da88fc2n, 0xd5a79147930aa725n, 0x06ca6351e003826fn, 0x142929670a0e6e70n,
    0x27b70a8546d22ffcn, 0x2e1b21385c26c926n, 0x4d2c6dfc5ac42aedn, 0x53380d139d95b3dfn,
    0x650a73548baf63den, 0x766a0abb3c77b2a8n, 0x81c2c92e47edaee6n, 0x92722c851482353bn,
    0xa2bfe8a14cf10364n, 0xa81a664bbc423001n, 0xc24b8b70d0f89791n, 0xc76c51a30654be30n,
    0xd192e819d6ef5218n, 0xd69906245565a910n, 0xf40e35855771202an, 0x106aa07032bbd1b8n,
    0x19a4c116b8d2d0c8n, 0x1e376c085141ab53n, 0x2748774cdf8eeb99n, 0x34b0bcb5e19b48a8n,
    0x391c0cb3c5c95a63n, 0x4ed8aa4ae3418acbn, 0x5b9cca4f7763e373n, 0x682e6ff3d6b2b8a3n,
    0x748f82ee5defb2fcn, 0x78a5636f43172f60n, 0x84c87814a1f0ab72n, 0x8cc702081a6439ecn,
    0x90befffa23631e28n, 0xa4506cebde82bde9n, 0xbef9a3f7b2c67915n, 0xc67178f2e372532bn,
    0xca273eceea26619cn, 0xd186b8c721c0c207n, 0xeada7dd6cde0eb1en, 0xf57d4f7fee6ed178n,
    0x06f067aa72176fban, 0x0a637dc5a2c898a6n, 0x113f9804bef90daen, 0x1b710b35131c471bn,
    0x28db77f523047d84n, 0x32caab7b40c72493n, 0x3c9ebe0a15c9bebcn, 0x431d67c49c100d4cn,
    0x4cc5d4becb3e42b6n, 0x597f299cfc657e2an, 0x5fcb6fab3ad6faecn, 0x6c44198c4a475817n];
  var p = pad128(msg);
  var H = [
    0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
    0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n];
  var w = new Array(80);
  for (var i = 0; i < p.blocks; i++) {
    for (var j = 0; j < 16; j++) {
      var off = i * 128 + j * 8;
      w[j] = 0n;
      for (var b = 0; b < 8; b++) w[j] = (w[j] << 8n) | BigInt(p.dv.getUint8(off + b));
    }
    for (var j2 = 16; j2 < 80; j2++) {
      var s0 = rotr64(w[j2 - 15], 1n) ^ rotr64(w[j2 - 15], 8n) ^ (w[j2 - 15] >> 7n);
      var s1 = rotr64(w[j2 - 2], 19n) ^ rotr64(w[j2 - 2], 61n) ^ (w[j2 - 2] >> 6n);
      w[j2] = (w[j2 - 16] + s0 + w[j2 - 7] + s1) & M64;
    }
    var a = H[0], b2 = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], hh = H[7];
    for (var j3 = 0; j3 < 80; j3++) {
      var S1 = rotr64(e, 14n) ^ rotr64(e, 18n) ^ rotr64(e, 41n);
      var ch = (e & f) ^ (~e & g);
      var t1 = hh + S1 + ch + K[j3] + w[j3];
      var S0 = rotr64(a, 28n) ^ rotr64(a, 34n) ^ rotr64(a, 39n);
      var maj = (a & b2) ^ (a & c) ^ (b2 & c);
      var t2 = S0 + maj;
      hh = g; g = f; f = e; e = (d + t1) & M64;
      d = c; c = b2; b2 = a; a = (t1 + t2) & M64;
    }
    H[0] = (H[0] + a) & M64; H[1] = (H[1] + b2) & M64; H[2] = (H[2] + c) & M64; H[3] = (H[3] + d) & M64;
    H[4] = (H[4] + e) & M64; H[5] = (H[5] + f) & M64; H[6] = (H[6] + g) & M64; H[7] = (H[7] + hh) & M64;
  }
  return H.map(function (x) { return x.toString(16).padStart(16, "0"); }).join("");
}

// ================ 左栏 · 开发常用(1-10) ================

// 1. JSON
tool("json", "JSON 格式化", function () {
  h('<h1>JSON 格式化 / 校验</h1>'
    + '<div class="jtoolbar">'
    + '<button class="btn" id="fmt">格式化</button>'
    + '<button class="btn ghost" id="min">压缩</button>'
    + '<button class="btn ghost" id="foldall">全部折叠</button>'
    + '<button class="btn ghost" id="expandall">全部展开</button>'
    + '<label><input type="checkbox" id="ln" checked> 行号</label>'
    + '<span class="jstatus" id="stat"></span>'
    + '</div>'
    + '<div class="j-split">'
    + '<div class="j-left"><textarea id="j" class="jinput" spellcheck="false" placeholder=\'在此输入或粘贴 JSON,例如:{"name":"test","items":[1,2,3]}\'></textarea>'
    + '<div class="row">'
    + '<button class="btn ghost" id="clr">清空</button>'
    + '</div></div>'
    + '<div class="j-right"><div class="output json-out" id="out"></div>'
    + '<div class="row">'
    + '<button class="btn ghost" id="cp">复制结果</button>'
    + '<button class="btn ghost" id="dl">下载 .json</button>'
    + '</div></div>'
    + '</div>');
  var out = q("#out"), statEl = q("#stat");
  var lastText = "", lastName = "formatted.json";
  var LS_KEY = "owntools-json-input";
  try { var saved = localStorage.getItem(LS_KEY); if (saved) q("#j").value = saved; } catch (e) {}
  function tryParse() {
    var raw = q("#j").value;
    try { return [JSON.parse(raw), null]; }
    catch (e) {
      var msg = e.message;
      var pm = /position (\d+)/.exec(msg);
      if (pm) {
        var upto = raw.slice(0, +pm[1]);
        var line = upto.split("\n").length;
        var col = +pm[1] - (upto.lastIndexOf("\n") + 1) + 1;
        msg = "第 " + line + " 行 第 " + col + " 列出错:" + msg;
      }
      return [null, msg];
    }
  }
  function hlLine(line) {
    var re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
    var res = "", last = 0, m;
    while ((m = re.exec(line)) !== null) {
      res += esc(line.slice(last, m.index));
      if (m[1] !== undefined)
        res += '<span class="j-' + (m[2] ? "key" : "str") + '">' + esc(m[1]) + "</span>" + esc(m[2] || "");
      else
        res += '<span class="j-' + (/^(?:true|false|null)$/.test(m[0]) ? "kw" : "num") + '">' + esc(m[0]) + "</span>";
      last = m.index + m[0].length;
    }
    return res + esc(line.slice(last));
  }
  function deltaOf(line) {
    var d = 0, inStr = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (inStr) { if (ch === "\\") i++; else if (ch === '"') inStr = false; continue; }
      if (ch === '"') inStr = true;
      else if (ch === "{" || ch === "[") d++;
      else if (ch === "}" || ch === "]") d--;
    }
    return d;
  }
  function buildTree(text) {
    var lines = text.split("\n");
    var deltas = lines.map(deltaOf);
    var match = {}, st = [];
    for (var i = 0; i < lines.length; i++) {
      if (deltas[i] > 0) st.push(i);
      else if (deltas[i] < 0 && st.length) match[st.pop()] = i;
    }
    var view = document.createElement("div");
    view.className = "jview";
    var stack = [];
    var cur = view;
    for (var k = 0; k < lines.length; k++) {
      var closeIdx = match[k];
      if (closeIdx !== undefined && closeIdx > k + 1) {
        var fold = document.createElement("div");
        fold.className = "jfold";
        var head = document.createElement("div");
        head.className = "jl jhead";
        head.innerHTML = '<span class="jtog"></span>' + hlLine(lines[k])
          + '<span class="jell"> … ' + esc(lines[closeIdx].trim()) + "</span>";
        fold.appendChild(head);
        var body = document.createElement("div");
        body.className = "jbody";
        fold.appendChild(body);
        cur.appendChild(fold);
        stack.push({ parent: cur, close: closeIdx, fold: fold });
        cur = body;
        continue;
      }
      if (stack.length && stack[stack.length - 1].close === k) {
        var e = stack.pop();
        var tail = document.createElement("div");
        tail.className = "jl jtail";
        tail.innerHTML = hlLine(lines[k]);
        e.fold.appendChild(tail);
        cur = e.parent;
        continue;
      }
      var ln = document.createElement("div");
      ln.className = "jl";
      ln.innerHTML = hlLine(lines[k]);
      cur.appendChild(ln);
    }
    return view;
  }
  function countNodes(o) {
    var c = 1;
    if (o && typeof o === "object") Object.keys(o).forEach(function (k) { c += countNodes(o[k]); });
    return c;
  }
  function setStat(s, isErr) {
    statEl.textContent = s;
    statEl.classList.toggle("err", !!isErr);
  }
  function runPretty() {
    var raw = q("#j").value;
    if (!raw.trim()) {
      out.className = "output json-out" + (q("#ln").checked ? "" : " hide-ln");
      out.innerHTML = "";
      lastText = "";
      setStat("");
      return;
    }
    var r = tryParse();
    if (r[1]) {
      out.className = "output err";
      out.innerText = "✗ " + r[1];
      setStat("JSON 无效", true);
      return;
    }
    var pretty = JSON.stringify(r[0], null, 2);
    lastText = pretty; lastName = "formatted.json";
    out.className = "output json-out" + (q("#ln").checked ? "" : " hide-ln");
    out.innerHTML = "";
    out.appendChild(buildTree(pretty));
    setStat("✓ 有效 JSON · " + countNodes(r[0]) + " 个节点 · " + pretty.split("\n").length + " 行");
  }
  function runMin() {
    var raw = q("#j").value;
    if (!raw.trim()) { setStat("请先输入 JSON", true); return; }
    var r = tryParse();
    if (r[1]) {
      out.className = "output err";
      out.innerText = "✗ " + r[1];
      setStat("JSON 无效", true);
      return;
    }
    lastText = JSON.stringify(r[0]); lastName = "minified.json";
    out.className = "output ok";
    out.innerText = lastText;
    setStat("✓ 已压缩 · " + lastText.length + " 字符");
  }
  var deb = null;
  q("#j").oninput = function () {
    try { localStorage.setItem(LS_KEY, q("#j").value); } catch (e) {}
    if (deb) clearTimeout(deb);
    deb = setTimeout(function () { runPretty(); deb = null; }, 300);
  };
  q("#fmt").onclick = runPretty;
  q("#min").onclick = runMin;
  q("#ln").onchange = function () {
    if (lastText && lastName === "formatted.json") runPretty();
    else out.classList.toggle("hide-ln", !q("#ln").checked);
  };
  q("#foldall").onclick = function () {
    Array.prototype.forEach.call(out.querySelectorAll(".jfold"), function (f) { f.classList.add("closed"); });
  };
  q("#expandall").onclick = function () {
    Array.prototype.forEach.call(out.querySelectorAll(".jfold"), function (f) { f.classList.remove("closed"); });
  };
  out.onclick = function (ev) {
    var t = ev.target;
    while (t && t !== out) {
      if (t.classList && t.classList.contains("jhead")) { t.parentNode.classList.toggle("closed"); return; }
      t = t.parentNode;
    }
  };
  q("#dl").onclick = function () {
    if (!lastText) { toast("没有可下载的结果"); return; }
    var blob = new Blob([lastText], { type: "application/json;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = lastName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 800);
  };
  q("#clr").onclick = function () {
    q("#j").value = "";
    try { localStorage.setItem(LS_KEY, ""); } catch (e) {}
    out.className = "output json-out";
    out.innerHTML = "";
    lastText = "";
    setStat("");
  };
  q("#cp").onclick = function (ev) {
    if (lastText) copyText(lastText, ev.target);
    else toast("没有可复制的结果");
  };
  if (q("#j").value.trim()) runPretty();
}, "json format 校验 压缩 转换 validate pretty 实时 行号 折叠 复制 下载");

tool("ts", "时间戳转换", function () {
  h('<div class="page-center"><div style="width:100%;max-width:480px">'
    + '<h1>Unix 时间戳转换</h1><div class="desc">时间戳与北京时间互转 · 秒/毫秒自动识别 · 相对时间 · 点击结果即可复制</div>'
    + '<div class="ts-col">'
    + '<label>① 时间戳 → 日期</label>'
    + '<input type="text" id="t" placeholder="1724400000(秒/毫秒自动识别)" autocomplete="off">'
    + '<button class="btn ts-btn" id="c1">转 换</button>'
    + '<div class="ts-res" id="res1"></div>'
    + '<label>② 日期 → 时间戳</label>'
    + '<input type="text" id="d" placeholder="2026-08-23 15:30:00" autocomplete="off">'
    + '<button class="btn ts-btn" id="c2">转 换</button>'
    + '<div class="ts-res" id="res2"></div>'
    + '</div>'
    + '<div class="ts-divider"></div>'
    + '<div class="ts-now-title">当 前 时 间</div>'
    + '<div class="ts-rows" id="now"></div>'
    + '</div></div>');
  function fmt(d) {
    return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate())
      + " " + p2(d.getHours()) + ":" + p2(d.getMinutes()) + ":" + p2(d.getSeconds());
  }
  function week(d) { return "周" + "日一二三四五六"[d.getDay()]; }
  function rel(d) {
    var diff = d.getTime() - Date.now();
    var s = Math.round(Math.abs(diff) / 1000), txt;
    if (s < 60) txt = s + " 秒";
    else if (s < 3600) txt = Math.round(s / 60) + " 分钟";
    else if (s < 86400) txt = Math.round(s / 3600) + " 小时";
    else txt = Math.round(s / 86400) + " 天";
    return diff < 0 ? txt + "前" : txt + "后";
  }
  function doy(d) {
    var start = new Date(d.getFullYear(), 0, 1);
    return Math.floor((d - start) / 86400000) + 1;
  }
  // 渲染一组「标签 + 蓝色值 + 复制链接」结果行;err 时显示错误
  function renderRows(box, rows, err) {
    box.innerHTML = "";
    if (err) {
      var e = document.createElement("div");
      e.className = "ts-err";
      e.innerText = "✗ " + err;
      box.appendChild(e);
      return;
    }
    rows.forEach(function (r, i) {
      var line = document.createElement("div");
      line.className = "ts-line";
      var k = document.createElement("span");
      k.className = "ts-k";
      k.innerText = r[0];
      var v = document.createElement("span");
      v.className = "ts-v";
      v.innerText = r[1];
      v.title = "点击复制";
      v.onclick = function () { copyText(r[1]); };
      line.appendChild(k);
      line.appendChild(v);
      if (i === 0) {  // 第一行右侧提供「复制」链接
        var cp = document.createElement("span");
        cp.className = "ts-copy";
        cp.innerText = "复制";
        cp.onclick = function (ev) { copyText(r[1], ev.target); };
        line.appendChild(cp);
      }
      box.appendChild(line);
    });
  }
  q("#c1").onclick = function () {
    var v = q("#t").value.trim().replace(/[^0-9]/g, "");
    if (!v) { renderRows(q("#res1"), null, "请输入时间戳"); return; }
    var ms = v.length >= 13 ? +v : +v * 1000;
    var d = new Date(ms);
    renderRows(q("#res1"), [
      ["北京时间", fmt(d) + "(" + week(d) + ")"],
      ["ISO 8601", d.toISOString()],
      ["相对现在", rel(d)],
      ["今年第", doy(d) + " 天"]
    ]);
  };
  q("#c2").onclick = function () {
    var raw = q("#d").value.trim();
    var d = new Date(raw.indexOf("T") >= 0 ? raw : raw.replace(/-/g, "/"));
    if (isNaN(d.getTime())) {
      renderRows(q("#res2"), null, "日期格式无效,示例 2026-08-23 15:30:00");
      return;
    }
    renderRows(q("#res2"), [
      ["秒级时间戳", String(Math.floor(d.getTime() / 1000))],
      ["毫秒时间戳", String(d.getTime())],
      ["ISO 8601", d.toISOString()],
      ["星期", week(d)]
    ]);
  };
  q("#t").onkeydown = function (e) { if (e.key === "Enter") q("#c1").click(); };
  q("#d").onkeydown = function (e) { if (e.key === "Enter") q("#c2").click(); };
  // 当前时间:4 行结果,每秒刷新,点击复制
  function renderNow() {
    var box = q("#now");
    if (!box) return;
    var nd = new Date();
    var rows = [
      ["北京时间", fmt(nd) + "(" + week(nd) + ")"],
      ["秒级时间戳", String(Math.floor(nd.getTime() / 1000))],
      ["毫秒时间戳", String(nd.getTime())],
      ["UTC 时间", nd.toISOString().replace("T", " ").slice(0, 19)]
    ];
    box.innerHTML = "";
    rows.forEach(function (r) {
      var line = document.createElement("div");
      line.className = "ts-row";
      var k = document.createElement("span");
      k.className = "ts-k";
      k.innerText = r[0];
      var v = document.createElement("span");
      v.className = "ts-v";
      v.innerText = r[1];
      v.title = "点击复制";
      v.onclick = function () { copyText(r[1]); };
      line.appendChild(k);
      line.appendChild(v);
      box.appendChild(line);
    });
  }
  renderNow();
  var timer = setInterval(renderNow, 1000);
  onCleanup.push(function () { clearInterval(timer); });
}, "timestamp 时间戳 毫秒 秒 日期 date clock 时钟 现在 相对 转换 unix");

// 3. Base64
tool("b64", "Base64 编解码", function () {
  h('<div class="tool-wrap">'
    + '<h1>Base64 编码 / 解码</h1><div class="desc">支持中文(UTF-8)· 编码 / 解码一键互转 · 数据不出本地</div>'
    + '<div class="tcard">'
    + '<label>输入文本</label>'
    + '<textarea id="s" placeholder="输入要编码或解码的文本"></textarea>'
    + '<div class="row"><button class="btn" id="enc">编 码</button>'
    + '<button class="btn ghost" id="dec">解 码</button>'
    + '<button class="btn ghost" id="cp">复制结果</button></div>'
    + '<div class="output" id="out"></div>'
    + '</div></div>');
  q("#enc").onclick = function () {
    q("#out").className = "output ok";
    q("#out").innerText = btoa(unescape(encodeURIComponent(q("#s").value)));
  };
  q("#dec").onclick = function () {
    try {
      q("#out").className = "output ok";
      q("#out").innerText = decodeURIComponent(escape(atob(q("#s").value.trim())));
    } catch (e) {
      q("#out").className = "output err";
      q("#out").innerText = "X 不是有效的 Base64";
    }
  };
  q("#cp").onclick = copyOut;
}, "base64 编码 解码 encode decode 加密");

// 4. URL
tool("url", "URL 编解码", function () {
  h('<div class="tool-wrap">'
    + '<h1>URL 编码 / 解码</h1><div class="desc">将网址中的中文、空格、& 等特殊字符转换为 %XX 百分号编码,或反向还原 · 常用于接口传参、链接拼接、调试抓包</div>'
    + '<div class="tcard">'
    + '<label>输入内容</label>'
    + '<textarea id="s" placeholder="https://example.com/?q=你好 world"></textarea>'
    + '<div class="row"><button class="btn" id="enc">编 码</button>'
    + '<button class="btn ghost" id="dec">解 码</button>'
    + '<button class="btn ghost" id="cp">复制结果</button></div>'
    + '<div class="output" id="out"></div>'
    + '</div></div>');
  q("#enc").onclick = function () {
    q("#out").className = "output ok";
    q("#out").innerText = encodeURIComponent(q("#s").value);
  };
  q("#dec").onclick = function () {
    try {
      q("#out").className = "output ok";
      q("#out").innerText = decodeURIComponent(q("#s").value);
    } catch (e) {
      q("#out").className = "output err";
      q("#out").innerText = "X 解码失败,请检查输入";
    }
  };
  q("#cp").onclick = copyOut;
}, "url encode decode 编码 解码 百分号 转义 uri");

// 5. UUID
tool("uuid", "UUID 生成器", function () {
  h('<div class="tool-wrap">'
    + '<h1>UUID 生成器</h1><div class="desc">批量生成 UUID v4 · 可选大小写 / 连字符 · 点击单条即可复制</div>'
    + '<div class="tcard">'
    + '<div class="row">'
    + '<label>数量 <input type="number" id="n" value="5" min="1" max="100" style="width:76px"></label>'
    + '<label>大小写 <select id="cs" style="width:86px"><option value="lower">小写</option><option value="upper">大写</option></select></label>'
    + '<label><input type="checkbox" id="hy" checked> 包含连字符 -</label>'
    + '</div>'
    + '<button class="btn big" id="g">生 成</button>'
    + '<div class="uuid-list" id="out"></div>'
    + '<div class="row"><button class="btn ghost" id="cp">复制全部</button></div>'
    + '</div></div>');
  var all = [];
  function uuid4() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === "x" ? r : (r & 3 | 8)).toString(16);
    });
  }
  q("#g").onclick = function () {
    var n = Math.min(100, Math.max(1, +q("#n").value || 5));
    var up = q("#cs").value === "upper";
    var box = q("#out");
    all = [];
    box.innerHTML = "";
    for (var i = 0; i < n; i++) {
      var u = uuid4();
      if (!q("#hy").checked) u = u.replace(/-/g, "");
      if (up) u = u.toUpperCase();
      all.push(u);
      var row = document.createElement("div");
      row.className = "urow";
      var sp = document.createElement("span");
      sp.textContent = u;
      sp.title = "点击复制";
      sp.onclick = function () { copyText(this.textContent); };
      row.appendChild(sp);
      box.appendChild(row);
    }
  };
  q("#cp").onclick = function (ev) {
    if (all.length) copyText(all.join("\n"), ev.target);
    else toast("请先生成 UUID");
  };
  q("#g").click();
}, "uuid guid 唯一id 随机id 标识符");

// 6. JWT 解码
tool("jwt", "JWT 解码", function () {
  h('<div class="tool-wrap">'
    + '<h1>JWT 解码</h1><div class="desc">粘贴 Token 实时解码 · Header / Payload / Signature 分区展示 · 自动换算 exp / nbf / iat 时间与过期状态 · 纯本地解码,不验证签名</div>'
    + '<div class="tcard">'
    + '<textarea id="s" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"></textarea>'
    + '<div class="row"><button class="btn" id="go">解 码</button>'
    + '<button class="btn ghost" id="cp">复制 Payload</button></div>'
    + '</div>'
    + '<div class="jwt-grid">'
    + '<div class="tcard jwt-card"><div class="jt">HEADER<span id="alg" style="color:var(--accent);margin-left:8px"></span></div><pre id="hd">-</pre></div>'
    + '<div class="tcard jwt-card"><div class="jt">PAYLOAD</div><pre id="pl">-</pre></div>'
    + '</div>'
    + '<div class="tcard jwt-card"><div class="jt">SIGNATURE</div><pre id="sig">-</pre></div>'
    + '<div class="tcard" id="tinfo" style="display:none"></div>'
    + '</div>');
  function b64u(s) { return s.replace(/-/g, "+").replace(/_/g, "/"); }
  function dec(seg) { return JSON.parse(decodeURIComponent(escape(atob(b64u(seg))))); }
  function tsTxt(v) {
    var d = new Date(v * 1000);
    return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate())
      + " " + p2(d.getHours()) + ":" + p2(d.getMinutes()) + ":" + p2(d.getSeconds());
  }
  function fail(msg) {
    q("#hd").textContent = msg;
    q("#pl").textContent = "";
    q("#sig").textContent = "";
    q("#alg").textContent = "";
    q("#tinfo").style.display = "none";
    q("#tinfo").innerHTML = "";
  }
  q("#go").onclick = function () {
    var parts = q("#s").value.trim().replace(/^Bearer\s+/i, "").split(".");
    if (parts.length < 2) { fail("✗ 格式无效:应为 header.payload.signature 三段(以 . 分隔)"); return; }
    var head, pl;
    try { head = dec(parts[0]); } catch (e) { fail("✗ Header 解码失败(不是合法 Base64URL)"); return; }
    try { pl = dec(parts[1]); } catch (e) { fail("✗ Payload 解码失败(不是合法 Base64URL)"); return; }
    q("#alg").textContent = head.alg || "";
    q("#hd").textContent = JSON.stringify(head, null, 2);
    q("#pl").textContent = JSON.stringify(pl, null, 2);
    q("#sig").textContent = parts[2] || "(无)";
    var rows = "";
    ["iat", "nbf", "exp"].forEach(function (k) {
      if (typeof pl[k] === "number") {
        rows += '<div class="hrow"><span class="hname">' + k + '</span><span class="hval">' + esc(tsTxt(pl[k])) + "</span></div>";
      }
    });
    var badge = "";
    if (typeof pl.exp === "number") {
      var expired = pl.exp * 1000 < Date.now();
      badge = '<div class="hrow"><span class="hname">过期状态</span>'
        + '<span class="badge ' + (expired ? "err" : "ok") + '">' + (expired ? "⚠ 已过期" : "✓ 未过期") + "</span></div>";
    }
    var info = q("#tinfo");
    if (rows || badge) {
      info.style.display = "";
      info.innerHTML = '<div class="hlist">' + rows + badge + "</div>";
      Array.prototype.forEach.call(info.querySelectorAll(".hval"), function (el) {
        el.title = "点击复制";
        el.onclick = function () { copyText(el.textContent); };
      });
    } else {
      info.style.display = "none";
      info.innerHTML = "";
    }
  };
  q("#s").oninput = function () { q("#go").click(); };
  q("#cp").onclick = function (ev) {
    var t = q("#pl").textContent;
    if (t && t !== "-") copyText(t, ev.target);
    else toast("没有可复制的解码结果");
  };
}, "jwt token 令牌 解析 登录 过期");

// 7. Regex
var RE_LIB = [
  ["手机号", "1[3-9]\\d{9}", "13812345678"],
  ["邮箱", "[\\w.+-]+@[\\w-]+\\.[\\w.]+", "hi@example.com"],
  ["URL", "https?://[^\\s]+", "https://example.com/path"],
  ["IPv4 地址", "(\\d{1,3}\\.){3}\\d{1,3}", "192.168.1.100"],
  ["日期 yyyy-MM-dd", "\\d{4}-\\d{2}-\\d{2}", "2026-08-26"],
  ["时间 HH:mm:ss", "\\d{2}:\\d{2}:\\d{2}", "12:30:59"],
  ["身份证(18位)", "\\d{17}[\\dXx]", "110101199003077758"],
  ["中文字符", "[\\u4e00-\\u9fa5]+", "Hello 你好"],
  ["QQ 号", "[1-9]\\d{4,10}", "123456789"],
  ["十六进制颜色", "#[0-9a-fA-F]{6}", "#38bdf8"]
];
tool("re", "正则表达式测试", function () {
  h('<div class="tool-wrap">'
    + '<h1>正则表达式测试</h1><div class="desc">输入正则实时测试 · 高亮匹配 · 常用正则库一键填入</div>'
    + '<div class="tcard">'
    + '<div class="row"><label>常用 <select id="lib" style="width:170px"><option value="">选择…</option></select></label>'
    + '<button class="btn ghost" id="gen">从示例生成</button>'
    + '<span class="desc" style="margin:0">每行一个示例,结构需一致</span></div>'
    + '<label>正则表达式</label><input type="text" id="re" value="\\d+">'
    + '<div class="row"><label><input type="checkbox" id="ig" checked> 忽略大小写 (i)</label>'
    + '<label><input type="checkbox" id="gl" checked> 全局 (g)</label>'
    + '<label><input type="checkbox" id="mu"> 多行 (m)</label>'
    + '<span class="jstatus" id="mcount"></span></div>'
    + '<label>测试文本</label><textarea id="s">订单A100、订单B233、订单C99</textarea>'
    + '<div class="output" id="out"></div>'
    + '<div class="row"><button class="btn ghost" id="cp">复制匹配结果</button></div>'
    + '</div></div>');
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  // 将一行示例切分为片段:d=数字 L=字母 zh=中文 lit=字面字符
  function runsOf(line) {
    var runs = [];
    function typeOf(ch) {
      if (ch >= "0" && ch <= "9") return "d";
      if ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z")) return "L";
      if (ch >= "\u4e00" && ch <= "\u9fa5") return "zh";
      return "lit";
    }
    var i = 0;
    while (i < line.length) {
      var t = typeOf(line[i]);
      if (t === "lit") { runs.push({ t: "lit", s: line[i] }); i++; continue; }
      var j = i;
      while (j < line.length && typeOf(line[j]) === t) j++;
      runs.push({ t: t, n: j - i });
      i = j;
    }
    return runs;
  }
  // 多行示例 → 合并为一个正则:结构必须一致,数量取各行的 min~max
  function genFromExamples(lines) {
    var all = lines.map(runsOf);
    var first = all[0];
    for (var k = 1; k < all.length; k++) {
      if (all[k].length !== first.length) return null;
      for (var i = 0; i < first.length; i++) {
        if (all[k][i].t !== first[i].t) return null;
        if (first[i].t === "lit" && all[k][i].s !== first[i].s) return null;
      }
    }
    var out = "";
    for (var i2 = 0; i2 < first.length; i2++) {
      var r = first[i2];
      if (r.t === "lit") { out += escRe(r.s); continue; }
      var cls = r.t === "d" ? "\\d" : r.t === "L" ? "[a-zA-Z]" : "[\\u4e00-\\u9fa5]";
      var mn = r.n, mx = r.n;
      for (var k2 = 1; k2 < all.length; k2++) {
        mn = Math.min(mn, all[k2][i2].n);
        mx = Math.max(mx, all[k2][i2].n);
      }
      out += cls + (mn === mx ? (mn > 1 ? "{" + mn + "}" : "") : "{" + mn + "," + mx + "}");
    }
    return out;
  }

  RE_LIB.forEach(function (item, i) {
    var o = document.createElement("option");
    o.value = String(i);
    o.textContent = item[0];
    q("#lib").appendChild(o);
  });
  q("#lib").onchange = function () {
    if (q("#lib").value === "") return;
    var item = RE_LIB[+q("#lib").value];
    q("#re").value = item[1];
    q("#s").value = item[2];
    run();
  };
  q("#gen").onclick = function () {
    var lines = q("#s").value.split(/\r?\n/).map(function (l) { return l.trim(); })
      .filter(Boolean).slice(0, 20);
    if (lines.length < 1) { toast("请先在文本框输入示例(每行一个)"); return; }
    var p = genFromExamples(lines);
    if (p === null) {
      toast("各行示例结构不一致,请保持相同格式");
      return;
    }
    q("#re").value = p;
    run();
  };
  function run() {
    var flags = (q("#ig").checked ? "i" : "") + (q("#gl").checked ? "g" : "") + (q("#mu").checked ? "m" : "");
    var re;
    try { re = new RegExp(q("#re").value, flags); }
    catch (e) {
      q("#mcount").textContent = "";
      q("#out").className = "output err";
      q("#out").innerText = "X 正则语法错误:" + e.message;
      return;
    }
    var txt = q("#s").value;
    var reG = new RegExp(re.source, (flags.indexOf("g") >= 0 ? flags : flags + "g"));
    var ms = [], m;
    while ((m = reG.exec(txt)) !== null) {
      ms.push({ text: m[0], index: m.index, groups: m.slice(1) });
      if (m[0] === "") reG.lastIndex++;
    }
    if (!ms.length) {
      q("#mcount").textContent = "0 处匹配";
      q("#out").className = "output err";
      q("#out").innerText = "无匹配(0 处)";
      return;
    }
    var last = 0, html = "";
    for (var i = 0; i < ms.length; i++) {
      html += esc(txt.slice(last, ms[i].index)) + '<span class="re-hl">' + esc(ms[i].text) + "</span>";
      last = ms[i].index + ms[i].text.length;
    }
    html += esc(txt.slice(last));
    q("#mcount").textContent = "共 " + ms.length + " 处匹配";
    var list = "\n\n共 " + ms.length + " 处匹配:";
    ms.forEach(function (x, n) {
      list += "\n#" + (n + 1) + "  \"" + x.text + "\"  (位置 " + x.index + ")";
      if (x.groups.length) list += "  捕获组 " + JSON.stringify(x.groups);
    });
    q("#out").className = "output ok";
    q("#out").innerHTML = html.replace(/\n/g, "<br>") + "<br>" + esc(list);
    q("#out").dataset.matches = ms.map(function (x) { return x.text; }).join("\n");
  }
  ["re", "s", "ig", "gl", "mu"].forEach(function (id) {
    q("#" + id).oninput = run;
    q("#" + id).onchange = run;
  });
  q("#cp").onclick = function (ev) {
    var el = q("#out");
    copyText(el && el.dataset && el.dataset.matches ? el.dataset.matches : el.innerText, ev.target);
  };
  run();
}, "regex regexp 正则 表达式 匹配 替换 test pattern");

// 8. Diff
tool("diff", "文本对比", function () {
  h('<h1>文本对比</h1><div class="desc">逐行对比两段文本</div>'
    + '<div style="display:flex;gap:10px">'
    + '<textarea id="a" style="min-height:180px" placeholder="原文本"></textarea>'
    + '<textarea id="b" style="min-height:180px" placeholder="新文本"></textarea></div>'
    + '<div class="row"><button class="btn" id="d">对比</button></div>'
    + '<div class="output" id="out"></div>'
    + '<div class="row"><button class="btn ghost" id="cp">复制结果</button></div>');
  q("#d").onclick = function () {
    var A = q("#a").value.split("\n"), B = q("#b").value.split("\n");
    var n = A.length, m = B.length;
    var dp = [];
    for (var i0 = 0; i0 <= n; i0++) { dp.push([]); for (var j0 = 0; j0 <= m; j0++) dp[i0].push(0); }
    for (var i = n - 1; i >= 0; i--)
      for (var j = m - 1; j >= 0; j--)
        dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    var lines = [], i = 0, j = 0;
    while (i < n && j < m) {
      if (A[i] === B[j]) { lines.push("  " + A[i]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { lines.push("- " + A[i]); i++; }
      else { lines.push("+ " + B[j]); j++; }
    }
    while (i < n) { lines.push("- " + A[i]); i++; }
    while (j < m) { lines.push("+ " + B[j]); j++; }
    var adds = 0, dels = 0;
    lines.forEach(function (l) { if (l[0] === "+") adds++; if (l[0] === "-") dels++; });
    var shown = lines.map(function (l) {
      if (l[0] === "+") return "+ " + l.slice(2);
      if (l[0] === "-") return "- " + l.slice(2);
      return "  " + l.slice(2);
    });
    q("#out").className = "output ok";
    q("#out").innerText = "+" + adds + " 行新增  -" + dels + " 行删除\n\n" + shown.join("\n");
  };
  q("#cp").onclick = copyOut;
}, "diff 对比 比较 compare difference 差异");

// 9. Hash
tool("hash", "哈希计算", function () {
  h('<div class="tool-wrap">'
    + '<h1>哈希计算</h1><div class="desc">输入文本实时计算 MD5 / SHA-1 / SHA-256 / SHA-512 · 点击任意一行结果即可复制</div>'
    + '<div class="tcard">'
    + '<label>输入文本</label><textarea id="s" placeholder="输入或粘贴文本,自动实时计算"></textarea>'
    + '<div class="hlist" id="out"></div>'
    + '</div></div>');
  var ALGOS = [["MD5", md5], ["SHA-1", sha1], ["SHA-256", sha256], ["SHA-512", sha512]];
  function calc() {
    var data = new TextEncoder().encode(q("#s").value);
    var box = q("#out");
    box.innerHTML = "";
    ALGOS.forEach(function (a) {
      var row = document.createElement("div");
      row.className = "hrow";
      var name = document.createElement("span");
      name.className = "hname";
      name.textContent = a[0];
      var val = document.createElement("span");
      val.className = "hval";
      val.textContent = a[1](data);
      val.title = "点击复制 " + a[0];
      val.onclick = function () { copyText(val.textContent); };
      row.appendChild(name);
      row.appendChild(val);
      box.appendChild(row);
    });
  }
  q("#s").oninput = calc;
  calc();
}, "md5 sha1 sha256 sha512 哈希 散列 摘要 hash 加密 checksum");

// 10. Color(极简版)
var COLOR_NAMES = {
  black: "#000000", white: "#ffffff", red: "#ff0000", green: "#008000", blue: "#0000ff",
  yellow: "#ffff00", orange: "#ffa500", purple: "#800080", pink: "#ffc0cb", gray: "#808080",
  grey: "#808080", cyan: "#00ffff", magenta: "#ff00ff", brown: "#a52a2a", navy: "#000080",
  teal: "#008080", olive: "#808000", lime: "#00ff00", indigo: "#4b0082", violet: "#ee82ee",
  gold: "#ffd700", silver: "#c0c0c0", skyblue: "#87ceeb", coral: "#ff7f50", salmon: "#fa8072",
  tomato: "#ff6347", khaki: "#f0e68c", beige: "#f5f5dc", ivory: "#fffff0", snow: "#fffafa"
};
tool("color", "颜色转换", function () {
  h('<h1>颜色转换</h1><div class="desc">HEX / RGB 互转 · 点击结果复制 HEX</div>'
    + '<div class="color-preview" id="pv"><b id="pv-text">#38BDF8</b><span id="pv-rgb">rgb(56, 189, 248)</span></div>'
    + '<div class="row" style="margin-top:12px">'
    + '<input type="color" id="pick" value="#38bdf8" title="点击打开拾色器" style="width:64px;height:40px;border:none;background:none;cursor:pointer">'
    + '<input type="text" id="hex" value="#38bdf8" style="flex:1" placeholder="如 #38bdf8 / rgb(56,189,248) / hsl(199,93%,60%) / red"></div>'
    + '<div class="output ok" id="out" style="cursor:pointer" title="点击复制 HEX"></div>');
  function hsl2rgb(h2, s2, l2) {
    s2 /= 100; l2 /= 100;
    var k = function (n3) { return (n3 + h2 / 30) % 12; };
    var a = s2 * Math.min(l2, 1 - l2);
    var f = function (n3) { return l2 - a * Math.max(-1, Math.min(k(n3) - 3, Math.min(9 - k(n3), 1))); };
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }
  function parseColor(s) {
    s = s.trim().toLowerCase();
    if (COLOR_NAMES[s]) s = COLOR_NAMES[s];
    var m;
    if ((m = s.match(/^#?([0-9a-f]{3})$/))) {
      return [parseInt(m[1][0] + m[1][0], 16), parseInt(m[1][1] + m[1][1], 16), parseInt(m[1][2] + m[1][2], 16)];
    }
    if ((m = s.match(/^#?([0-9a-f]{6})$/))) {
      return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
    }
    if ((m = s.match(/^rgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})/))) {
      return [+m[1], +m[2], +m[3]];
    }
    if ((m = s.match(/^hsla?\(\s*(\d{1,3})(?:deg)?\s*[,\s]\s*(\d{1,3})%\s*[,\s]\s*(\d{1,3})%/))) {
      return hsl2rgb(+m[1], +m[2], +m[3]);
    }
    return null;
  }
  var lastHex = "#38bdf8";
  function render() {
    var rgb = parseColor(q("#hex").value);
    if (!rgb) {
      q("#out").className = "output err";
      q("#out").innerText = "X 无法识别的颜色格式";
      return;
    }
    var r = rgb[0], g = rgb[1], b = rgb[2];
    var hx = "#" + [r, g, b].map(function (v) { return v.toString(16).padStart(2, "0"); }).join("");
    lastHex = hx;
    q("#pv").style.background = hx;
    var lum = (r * 299 + g * 587 + b * 114) / 1000;
    q("#pv").style.color = lum > 140 ? "#0b1120" : "#ffffff";
    q("#pv-text").textContent = hx.toUpperCase();
    q("#pv-rgb").textContent = "rgb(" + r + ", " + g + ", " + b + ")";
    q("#pick").value = hx;
    q("#out").className = "output ok";
    q("#out").innerText = "HEX  " + hx.toUpperCase() + "\nRGB  rgb(" + r + ", " + g + ", " + b + ")";
  }
  q("#pick").oninput = function () { q("#hex").value = q("#pick").value; render(); };
  q("#hex").oninput = render;
  q("#out").onclick = function () { copyText(lastHex); };
  render();
}, "color 颜色 hex rgb hsl 取色 拾色器 色值 picker");

// ================ 右栏 · 实用工具(11-20) ================

// 11. 进制转换
tool("radix", "进制转换", function () {
  h('<h1>进制转换</h1><div class="desc">2 / 8 / 10 / 16 进制互转 · 支持超大数 · 0x / 0b / 0o 前缀自动识别</div>'
    + '<div class="row">'
    + '<select id="src" style="width:110px"><option value="16">16 进制</option><option value="10" selected>10 进制</option><option value="8">8 进制</option><option value="2">2 进制</option></select>'
    + '<input type="text" id="v" placeholder="如 255 或 0xFF" style="flex:1"></div>'
    + '<div class="row"><button class="btn" id="go">转换</button></div>'
    + '<div class="output" id="out"></div>'
    + '<div class="row"><button class="btn ghost" id="cp">复制结果</button></div>');
  q("#go").onclick = function () {
    var raw = q("#v").value.trim().toLowerCase().replace(/[\s_]/g, "");
    var radix = +q("#src").value;
    var m;
    if ((m = raw.match(/^0x([0-9a-f]+)$/))) { radix = 16; raw = m[1]; }
    else if ((m = raw.match(/^0b([01]+)$/))) { radix = 2; raw = m[1]; }
    else if ((m = raw.match(/^0o([0-7]+)$/))) { radix = 8; raw = m[1]; }
    var ok = true;
    for (var i = 0; i < raw.length; i++) {
      var d = parseInt(raw[i], 36);
      if (isNaN(d) || d >= radix) { ok = false; break; }
    }
    if (!raw || !ok) {
      q("#out").className = "output err";
      q("#out").innerText = "X 输入不是有效的 " + radix + " 进制数";
      return;
    }
    var n = 0n;
    var R = BigInt(radix);
    for (var k = 0; k < raw.length; k++) n = n * R + BigInt(parseInt(raw[k], 36));
    q("#out").className = "output ok";
    q("#out").innerText = "10 进制  " + n.toString(10)
      + "\n16 进制  0x" + n.toString(16).toUpperCase()
      + "\n8 进制   0o" + n.toString(8)
      + "\n2 进制   0b" + n.toString(2);
  };
  q("#v").onkeydown = function (e) { if (e.key === "Enter") q("#go").click(); };
  q("#cp").onclick = copyOut;
}, "进制 二进制 八进制 十进制 十六进制 转换 bin oct dec hex byte");

// 12. 字数统计
tool("wc", "字数统计", function () {
  h('<h1>字数统计</h1><div class="desc">实时统计:字符 / 中文字数 / 英文单词 / 行数 / 字节</div>'
    + '<textarea id="s" placeholder="粘贴或输入文本,自动实时统计"></textarea>'
    + '<div class="output ok" id="out"></div>');
  function stat() {
    var t = q("#s").value;
    var cjk = (t.match(/[\u4e00-\u9fa5]/g) || []).length;
    var words = (t.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || []).length;
    var lines = t === "" ? 0 : t.split(/\r\n|\r|\n/).length;
    var bytes = new TextEncoder().encode(t).length;
    q("#out").innerText = "总字符数(含空白)   " + t.length
      + "\n总字符数(不含空白)  " + t.replace(/\s/g, "").length
      + "\n中文字数      " + cjk
      + "\n英文单词      " + words
      + "\n行数        " + lines
      + "\nUTF-8 字节数   " + bytes;
  }
  q("#s").oninput = stat;
  stat();
}, "字数 统计 字符 count words 行数 段落 字节 length");

// 13. 大小写/命名转换
tool("case", "大小写转换", function () {
  h('<h1>大小写 / 命名转换</h1><div class="desc">大写、小写、驼峰、下划线、中划线等一键转换 · 点击结果复制</div>'
    + '<textarea id="s" placeholder="hello world / helloWorld / hello_world"></textarea>'
    + '<div class="row" id="btns"></div>'
    + '<div class="output" id="out"></div>');
  function splitWords(s) {
    return s.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
            .replace(/[_\-.]+/g, " ")
            .split(/\s+/)
            .filter(Boolean);
  }
  function cap(w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); }
  var CASES = [
    ["全部大写", function (t) { return t.toUpperCase(); }],
    ["全部小写", function (t) { return t.toLowerCase(); }],
    ["首字母大写", function (t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; }],
    ["每词首字母大写", function (t) { return splitWords(t).map(cap).join(" "); }],
    ["小驼峰 camelCase", function (t) { return splitWords(t).map(function (w, i) { return i ? cap(w) : w.toLowerCase(); }).join(""); }],
    ["大驼峰 PascalCase", function (t) { return splitWords(t).map(cap).join(""); }],
    ["下划线 snake_case", function (t) { return splitWords(t).map(function (w) { return w.toLowerCase(); }).join("_"); }],
    ["中划线 kebab-case", function (t) { return splitWords(t).map(function (w) { return w.toLowerCase(); }).join("-"); }],
    ["常量 CONST_CASE", function (t) { return splitWords(t).map(function (w) { return w.toUpperCase(); }).join("_"); }]
  ];
  CASES.forEach(function (c, i) {
    var b = document.createElement("button");
    b.className = "btn ghost";
    b.textContent = c[0];
    b.onclick = function () {
      q("#out").className = "output ok";
      q("#out").innerText = c[1](q("#s").value);
    };
    q("#btns").appendChild(b);
  });
  q("#out").onclick = function () { copyText(q("#out").innerText); };
}, "大小写 转换 驼峰 下划线 中划线 命名 camel snake kebab pascal upper lower");

// 14. 密码生成器
tool("pwd", "密码生成器", function () {
  h('<h1>密码生成器</h1><div class="desc">本地随机生成,绝不联网 · 点击密码即可复制</div>'
    + '<div class="row">'
    + '<label>长度 <input type="number" id="len" value="16" min="4" max="64" style="width:70px"></label>'
    + '<label><input type="checkbox" id="c1" checked> 大写 A-Z</label>'
    + '<label><input type="checkbox" id="c2" checked> 小写 a-z</label>'
    + '<label><input type="checkbox" id="c3" checked> 数字 0-9</label>'
    + '<label><input type="checkbox" id="c4" checked> 符号 !@#$%</label>'
    + '<label><input type="checkbox" id="c5" checked> 排除易混淆 0O1lI</label>'
    + '<button class="btn" id="g">生成</button></div>'
    + '<div class="output ok" id="out"></div>');
  function rndInt(max) {
    var a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % max;
  }
  q("#g").onclick = function () {
    var len = Math.min(64, Math.max(4, +q("#len").value || 16));
    var upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var lower = "abcdefghijklmnopqrstuvwxyz";
    var digit = "0123456789";
    var sym = "!@#$%^&*-_=+?";
    var pools = [];
    if (q("#c1").checked) pools.push(upper);
    if (q("#c2").checked) pools.push(lower);
    if (q("#c3").checked) pools.push(digit);
    if (q("#c4").checked) pools.push(sym);
    if (!pools.length) { toast("请至少勾选一种字符类型"); return; }
    if (q("#c5").checked) {
      pools = pools.map(function (p) { return p.replace(/[0O1lI|]/g, ""); }).filter(Boolean);
    }
    var all = pools.join("");
    var result = "";
    for (var r = 0; r < 3; r++) {
      var chars = [];
      pools.forEach(function (p) { chars.push(p[rndInt(p.length)]); });
      for (var i = chars.length; i < len; i++) chars.push(all[rndInt(all.length)]);
      for (var j = chars.length - 1; j > 0; j--) {
        var k = rndInt(j + 1);
        var tmp = chars[j]; chars[j] = chars[k]; chars[k] = tmp;
      }
      result += '<div class="copyline" data-c="' + esc(chars.join("")) + '">' + esc(chars.join("")) + "</div>";
    }
    q("#out").innerHTML = result;
    Array.prototype.forEach.call(q("#out").querySelectorAll(".copyline"), function (el) {
      el.onclick = function () { copyText(el.getAttribute("data-c")); };
    });
  };
  q("#g").click();
}, "密码 password 随机 生成 强密码 random strong 安全");

// 15. HTML 实体编解码
tool("htmlent", "HTML 实体编解码", function () {
  h('<h1>HTML 实体编解码</h1><div class="desc">& < > 等实体与字符互转 · 非 ASCII 转数字实体</div>'
    + '<textarea id="s" placeholder="输入 HTML 或含特殊字符的文本"></textarea>'
    + '<div class="row"><button class="btn" id="enc">编码</button>'
    + '<button class="btn ghost" id="dec">解码</button></div>'
    + '<div class="output" id="out"></div>'
    + '<div class="row"><button class="btn ghost" id="cp">复制结果</button></div>');
  q("#enc").onclick = function () {
    var s = q("#s").value;
    var out = s.replace(/[&<>"']/g, function (c) {
      return { "&": "&" + "amp;", "<": "&" + "lt;", ">": "&" + "gt;", '"': "&" + "quot;", "'": "&" + "#39;" }[c];
    }).replace(/[^\x00-\x7F]/g, function (c) {
      return "&#x" + c.codePointAt(0).toString(16) + ";";
    });
    q("#out").className = "output ok";
    q("#out").innerText = out;
  };
  q("#dec").onclick = function () {
    var t = document.createElement("textarea");
    t.innerHTML = q("#s").value;
    q("#out").className = "output ok";
    q("#out").innerText = t.value;
  };
  q("#cp").onclick = copyOut;
}, "html entity 实体 转义 编码 解码 escape unescape");

// 16. 单位换算
tool("unit", "单位换算", function () {
  h('<h1>单位换算</h1><div class="desc">长度 / 重量 / 数据大小 / 温度 · 输入即显示全部换算结果</div>'
    + '<div class="row">'
    + '<select id="cat" style="width:110px"></select>'
    + '<input type="text" id="v" value="1" style="width:110px">'
    + '<select id="from" style="flex:1"></select></div>'
    + '<div class="output ok" id="out"></div>');
  var CATS = {
    len: { name: "长度", u: [["纳米 nm", 1e-9], ["微米 um", 1e-6], ["毫米 mm", 0.001], ["厘米 cm", 0.01], ["米 m", 1], ["千米 km", 1000], ["英寸 in", 0.0254], ["英尺 ft", 0.3048], ["英里 mi", 1609.344]] },
    wt: { name: "重量", u: [["毫克 mg", 0.001], ["克 g", 1], ["千克 kg", 1000], ["吨 t", 1e6], ["斤", 500], ["两", 50], ["磅 lb", 453.59237], ["盎司 oz", 28.349523125]] },
    data: { name: "数据大小", u: [["B", 1], ["KB", 1024], ["MB", 1048576], ["GB", 1073741824], ["TB", 1099511627776], ["PB", 1125899906842624]] },
    temp: { name: "温度", special: true, u: [["摄氏度 °C"], ["华氏度 °F"], ["开尔文 K"]] }
  };
  function fmtN(x) {
    if (!isFinite(x)) return "-";
    if (x !== 0 && (Math.abs(x) >= 1e15 || Math.abs(x) < 1e-9)) return x.toExponential(6);
    return String(+x.toPrecision(12));
  }
  function fill(sel, items) {
    sel.innerHTML = "";
    items.forEach(function (it, i) {
      var o = document.createElement("option");
      o.value = String(i);
      o.textContent = it[0];
      sel.appendChild(o);
    });
  }
  function calc() {
    var cat = CATS[q("#cat").value];
    var v = parseFloat(q("#v").value);
    if (isNaN(v)) { q("#out").innerText = "请输入数字"; return; }
    var from = +q("#from").value;
    var lines = [];
    if (cat.special) {
      var c; // 先转为摄氏
      if (from === 0) c = v;
      else if (from === 1) c = (v - 32) * 5 / 9;
      else c = v - 273.15;
      var vals = [c, c * 9 / 5 + 32, c + 273.15];
      cat.u.forEach(function (u, i) { lines.push(u[0] + " = " + fmtN(vals[i])); });
    } else {
      var base = v * cat.u[from][1];
      cat.u.forEach(function (u) { lines.push(u[0] + " = " + fmtN(base / u[1])); });
    }
    q("#out").innerText = lines.join("\n");
  }
  fill(q("#cat"), Object.keys(CATS).map(function (k) { return [CATS[k].name, k]; }));
  function rebuild() {
    fill(q("#from"), CATS[q("#cat").value].u);
    calc();
  }
  q("#cat").onchange = rebuild;
  q("#from").onchange = calc;
  q("#v").oninput = calc;
  rebuild();
}, "单位 换算 长度 重量 温度 数据大小 斤 磅 米 英尺 unit convert");

// 17. 日期计算
tool("datecalc", "日期计算", function () {
  h('<h1>日期计算</h1><div class="desc">日期相差天数 / 日期加减</div>'
    + '<label>① 两个日期相差多少天</label>'
    + '<div class="row"><input type="date" id="d1" style="flex:1"> <span class="desc" style="margin:0">→</span> <input type="date" id="d2" style="flex:1">'
    + '<button class="btn" id="b1">计算</button></div>'
    + '<div class="output" id="out1"></div>'
    + '<label>② 日期加减 N 天/周/月</label>'
    + '<div class="row"><input type="date" id="d3" style="flex:1">'
    + '<input type="text" id="n" value="30" style="width:80px">'
    + '<select id="unit2" style="width:90px"><option value="d">天</option><option value="w">周</option><option value="m">月</option></select>'
    + '<button class="btn" id="b2">计算</button></div>'
    + '<div class="output" id="out2"></div>');
  function fmt(d) {
    return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()) + "(周" + "日一二三四五六"[d.getDay()] + ")";
  }
  var today = new Date();
  var iso = today.getFullYear() + "-" + p2(today.getMonth() + 1) + "-" + p2(today.getDate());
  q("#d1").value = iso;
  q("#d2").value = iso;
  q("#d3").value = iso;
  q("#b1").onclick = function () {
    var a = new Date(q("#d1").value + "T00:00:00");
    var b = new Date(q("#d2").value + "T00:00:00");
    if (isNaN(a) || isNaN(b)) { q("#out1").className = "output err"; q("#out1").innerText = "X 请选择日期"; return; }
    var days = Math.round((b - a) / 86400000);
    q("#out1").className = "output ok";
    q("#out1").innerText = "相差 " + Math.abs(days) + " 天"
      + "\n约 " + Math.floor(Math.abs(days) / 7) + " 周 " + (Math.abs(days) % 7) + " 天"
      + "\n起  " + fmt(a) + "\n止  " + fmt(b);
  };
  q("#b2").onclick = function () {
    var d = new Date(q("#d3").value + "T00:00:00");
    var n = parseInt(q("#n").value, 10);
    if (isNaN(d) || isNaN(n)) { q("#out2").className = "output err"; q("#out2").innerText = "X 请选择日期并输入数字"; return; }
    var u = q("#unit2").value;
    if (u === "d") d.setDate(d.getDate() + n);
    else if (u === "w") d.setDate(d.getDate() + n * 7);
    else d.setMonth(d.getMonth() + n);
    q("#out2").className = "output ok";
    q("#out2").innerText = "结果日期  " + fmt(d);
  };
  q("#b1").click();
  q("#b2").click();
}, "日期 计算 天数 相差 加减 倒计时 date days");

// 19. IP 归属地查询(联网)
tool("ip", "IP 归属地查询", function () {
  h('<h1>IP 归属地查询</h1>'
    + '<div class="net-tip">🌐 此工具需要联网:调用第三方接口(ipapi.co / ip.sb)查询,仅传输 IP 信息,不涉及你的其他数据</div>'
    + '<div class="row"><input type="text" id="ip" placeholder="留空查询本机公网 IP,或输入任意 IP" style="flex:1">'
    + '<button class="btn" id="go">查询</button></div>'
    + '<div class="output" id="out">点击「查询」查看本机公网 IP</div>');
  function normA(j) {
    if (j.error) throw new Error(j.reason || "接口返回错误");
    return { ip: j.ip, country: (j.country_name || j.country || "") + (j.country_code ? " (" + j.country_code + ")" : ""),
      region: j.region || "", city: j.city || "", org: j.org || j.organization || j.asn || "",
      tz: j.timezone || "", ll: (j.latitude != null && j.longitude != null) ? j.latitude + ", " + j.longitude : "", src: "ipapi.co" };
  }
  function normB(j) {
    return { ip: j.ip, country: (j.country || "") + (j.country_code ? " (" + j.country_code + ")" : ""),
      region: j.region || "", city: j.city || "", org: j.organization || j.isp || j.asn || "",
      tz: j.timezone || "", ll: (j.latitude != null && j.longitude != null) ? j.latitude + ", " + j.longitude : "", src: "api.ip.sb" };
  }
  function show(o) {
    q("#out").className = "output ok";
    q("#out").innerText = "IP       " + o.ip
      + "\n国家/地区  " + (o.country || "-")
      + "\n省份/城市  " + ((o.region + " " + o.city).trim() || "-")
      + "\n运营商/组织 " + (o.org || "-")
      + "\n时区      " + (o.tz || "-")
      + "\n经纬度     " + (o.ll || "-")
      + "\n数据来源   " + o.src;
  }
  q("#go").onclick = function () {
    var v = q("#ip").value.trim();
    var url = v ? "https://ipapi.co/" + encodeURIComponent(v) + "/json/" : "https://ipapi.co/json/";
    q("#out").className = "output";
    q("#out").innerText = "查询中…(需要联网)";
    fetch(url).then(function (r) { return r.json(); }).then(normA).then(show)
      .catch(function () {
        if (v) {
          q("#out").className = "output err";
          q("#out").innerText = "X 查询失败(可能无网络、IP 无效或接口限流)";
          return;
        }
        fetch("https://api.ip.sb/geoip").then(function (r2) { return r2.json(); })
          .then(normB).then(show)
          .catch(function () {
            q("#out").className = "output err";
            q("#out").innerText = "X 查询失败:请检查网络连接";
          });
      });
  };
}, "ip 归属地 公网 地址 位置 查询 network internet");

// 20. 二维码生成(联网)
tool("qr", "二维码生成", function () {
  h('<h1>二维码生成</h1>'
    + '<div class="net-tip">🌐 此工具需要联网:二维码图片由第三方服务 api.qrserver.com 生成,输入内容会发送到该服务,敏感信息请勿输入</div>'
    + '<textarea id="s" placeholder="输入网址或文本,如 https://owntools.cn" style="min-height:80px"></textarea>'
    + '<div class="row">'
    + '<select id="size" style="width:110px"><option value="150">150 x 150</option><option value="220" selected>220 x 220</option><option value="300">300 x 300</option><option value="500">500 x 500</option></select>'
    + '<button class="btn" id="go">生成二维码</button>'
    + '<a id="dl" class="btn ghost" href="#" target="_blank" rel="noopener" style="display:none;text-decoration:none">打开大图</a></div>'
    + '<div class="qr-box" id="box"><span class="desc">生成后图片显示在这里</span></div>');
  q("#go").onclick = function () {
    var text = q("#s").value.trim();
    if (!text) { toast("请先输入内容"); return; }
    var s = q("#size").value;
    var url = "https://api.qrserver.com/v1/create-qr-code/?size=" + s + "x" + s + "&margin=8&data=" + encodeURIComponent(text);
    q("#box").innerHTML = '<span class="desc">生成中…(需要联网)</span>';
    var img = new Image();
    img.onload = function () {
      q("#box").innerHTML = "";
      q("#box").appendChild(img);
      q("#dl").style.display = "inline-block";
      q("#dl").href = url;
    };
    img.onerror = function () {
      q("#box").innerHTML = '<span class="desc" style="color:var(--err)">X 生成失败:请检查网络连接</span>';
    };
    img.src = url;
    img.alt = "二维码";
  };
}, "二维码 qrcode 生成 扫码 跳转 分享");

// ---- Boot:单栏导航 + 图标 + 搜索 ----
var ICONS = {
  json: "{}", ts: "⏱", b64: "64", url: "%", uuid: "ID", jwt: "J", re: ".*", diff: "±", hash: "#", color: "◐",
  radix: "0x", wc: "文", case: "Aa", pwd: "***", htmlent: "&", unit: "⇄", datecalc: "📅", ip: "IP", qr: "▩"
};
// 顶栏直接展示的 10 个热门工具(按使用率排序),其余收进「更多」菜单
var HOT_IDS = ["json", "ts", "b64", "url", "re", "jwt", "hash", "uuid", "qr", "diff"];
var navL = document.getElementById("nav");
var moreMenu = document.getElementById("more-menu");
var navBtns = [];
TOOLS.forEach(function (t) {
  var b = document.createElement("button");
  b.innerHTML = '<span class="ico">' + ICONS[t.id] + "</span>" + esc(t.name);
  b.dataset.kw = (t.id + " " + t.name + " " + t.kw).toLowerCase();
  b.dataset.toolId = t.id;
  b.onclick = function () { openTool(t.id); closeMore(); };
  if (HOT_IDS.indexOf(t.id) >= 0) {
    navL.appendChild(b);
  } else if (moreMenu) {
    moreMenu.appendChild(b);
  }
  navBtns.push(b);
});
// 「更多」下拉菜单开关
var moreWrap = document.getElementById("more-wrap");
var moreBtn = document.getElementById("more-btn");
function closeMore() { if (moreWrap) moreWrap.classList.remove("open"); }
if (moreBtn) {
  moreBtn.onclick = function (e) { e.stopPropagation(); moreWrap.classList.toggle("open"); };
}
document.addEventListener("click", function (e) {
  if (moreWrap && moreWrap.contains(e.target)) return;
  closeMore();
});

// ---- 搜索:过滤菜单,回车打开第一个匹配 ----
var si = document.getElementById("search");
if (si) {
  si.oninput = function () {
    var v = si.value.trim().toLowerCase();
    navBtns.forEach(function (b) {
      b.style.display = (!v || b.dataset.kw.indexOf(v) >= 0) ? "" : "none";
    });
  };
  si.onkeydown = function (e) {
    if (e.key !== "Enter") return;
    var v = si.value.trim().toLowerCase();
    for (var i = 0; i < TOOLS.length; i++) {
      if (!v || navBtns[i].dataset.kw.indexOf(v) >= 0) { openTool(TOOLS[i].id); break; }
    }
  };
}

// ---- 工具切换 + hash 路由(链接可收藏,如 #jwt 直达 JWT 解码) ----
var currentId = null;
function openTool(id, fromHash) {
  var t = TOOLS.filter(function (x) { return x.id === id; })[0] || TOOLS[0];
  currentId = t.id;
  if (!fromHash && location.hash !== "#" + t.id) location.hash = t.id;
  navBtns.forEach(function (b) { b.classList.remove("active"); });
  navBtns[TOOLS.indexOf(t)].classList.add("active");
  t.render();
}
window.addEventListener("hashchange", function () {
  var id = location.hash.slice(1);
  if (id !== currentId) openTool(id || TOOLS[0].id, true);
});

openTool(location.hash.slice(1) || TOOLS[0].id, true);