"use strict";

const nav = document.getElementById("nav");
const main = document.getElementById("main");
const TOOLS = [];

function tool(id, name, render) { TOOLS.push({ id: id, name: name, render: render }); }
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
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
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

// ---- 纯 JS 哈希实现（不依赖 Web Crypto，http 环境也可用） ----
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
    0x3956c25bf348b538n, 0x59f111f1b605d019n, 0x923f82a4af194f9bn, 0xab1c5ed5da6d8118n,
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

// 1. JSON
tool("json", "JSON 格式化", function () {
  h('<h1>JSON 格式化 / 校验</h1><div class="desc">粘贴 JSON，支持格式化、压缩、转义</div>'
    + '<textarea id="j" placeholder=\'{"name":"test","items":[1,2,3]}\'></textarea>'
    + '<div class="row"><button class="btn" id="fmt">格式化</button>'
    + '<button class="btn ghost" id="min">压缩</button></div>'
    + '<div class="output" id="out"></div>'
    + '<div class="row"><button class="btn ghost" id="cp">复制结果</button></div>');
  var out = q("#out");
  function tryParse() {
    try { return [JSON.parse(q("#j").value), null]; }
    catch (e) { return [null, e.message]; }
  }
  q("#fmt").onclick = function () {
    var r = tryParse();
    out.className = r[1] ? "output err" : "output ok";
    out.innerText = r[1] ? "X " + r[1] : JSON.stringify(r[0], null, 2);
  };
  q("#min").onclick = function () {
    var r = tryParse();
    out.className = r[1] ? "output err" : "output ok";
    out.innerText = r[1] ? "X " + r[1] : JSON.stringify(r[0]);
  };
  q("#cp").onclick = copyOut;
});

// 2. Timestamp
tool("ts", "时间戳转换", function () {
  h('<h1>Unix 时间戳转换</h1><div class="desc">时间戳与北京时间互转，实时时钟</div>'
    + '<div class="output ok" id="clock"></div>'
    + '<label>时间戳（秒/毫秒自动识别）</label>'
    + '<input type="text" id="t" placeholder="1724400000">'
    + '<div class="row"><button class="btn" id="c1">转日期</button></div>'
    + '<div class="output" id="out"></div>'
    + '<div class="row"><button class="btn ghost" id="cp1">复制结果</button></div>'
    + '<label>日期字符串</label>'
    + '<input type="text" id="d" placeholder="2026-08-23 15:30:00">'
    + '<div class="row"><button class="btn" id="c2">转时间戳</button></div>'
    + '<div class="output" id="out2"></div>'
    + '<div class="row"><button class="btn ghost" id="cp2">复制结果</button></div>');
  function fmt(d) {
    return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate())
      + " " + p2(d.getHours()) + ":" + p2(d.getMinutes()) + ":" + p2(d.getSeconds());
  }
  function tick() {
    q("#clock").innerText = "当前时间 " + fmt(new Date())
      + " | 时间戳(s) " + Math.floor(Date.now() / 1000);
  }
  tick();
  var timer = setInterval(tick, 1000);
  onCleanup.push(function () { clearInterval(timer); });
  q("#c1").onclick = function () {
    var v = q("#t").value.trim().replace(/[^0-9]/g, "");
    if (!v) return;
    var ms = v.length >= 13 ? +v : +v * 1000;
    var d = new Date(ms);
    q("#out").className = "output ok";
    q("#out").innerText = fmt(d) + "（周" + "日一二三四五六"[d.getDay()] + "）";
  };
  q("#c2").onclick = function () {
    var d = new Date(q("#d").value.replace(/-/g, "/"));
    if (isNaN(d.getTime())) {
      q("#out2").className = "output err";
      q("#out2").innerText = "X 日期格式无效";
      return;
    }
    q("#out2").className = "output ok";
    q("#out2").innerText = "秒 " + Math.floor(d.getTime() / 1000) + "\n毫秒 " + d.getTime();
  };
  q("#cp1").onclick = function (ev) { copyOut(ev); };
  q("#cp2").onclick = function (ev) { copyOut(ev, "out2"); };
});

// 3. Base64
tool("b64", "Base64 编解码", function () {
  h('<h1>Base64 编码 / 解码</h1><div class="desc">支持中文（UTF-8）</div>'
    + '<textarea id="s" placeholder="输入文本"></textarea>'
    + '<div class="row"><button class="btn" id="enc">编码</button>'
    + '<button class="btn ghost" id="dec">解码</button></div>'
    + '<div class="output" id="out"></div>'
    + '<div class="row"><button class="btn ghost" id="cp">复制结果</button></div>');
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
});

// 4. URL
tool("url", "URL 编解码", function () {
  h('<h1>URL 编码 / 解码</h1><div class="desc">encodeURIComponent / decodeURIComponent</div>'
    + '<textarea id="s" placeholder="https://example.com/?q=hello"></textarea>'
    + '<div class="row"><button class="btn" id="enc">编码</button>'
    + '<button class="btn ghost" id="dec">解码</button></div>'
    + '<div class="output" id="out"></div>'
    + '<div class="row"><button class="btn ghost" id="cp">复制结果</button></div>');
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
      q("#out").innerText = "X 解码失败，请检查输入";
    }
  };
  q("#cp").onclick = copyOut;
});

// 5. UUID
tool("uuid", "UUID 生成器", function () {
  h('<h1>UUID 生成器</h1><div class="desc">批量生成 v4 UUID</div>'
    + '<div class="row"><input type="text" id="n" value="5" style="width:100px">'
    + '<button class="btn" id="g">生成</button></div>'
    + '<div class="output" id="out"></div>'
    + '<div class="row"><button class="btn ghost" id="cp">复制结果</button></div>');
  function uuid4() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === "x" ? r : (r & 3 | 8)).toString(16);
    });
  }
  q("#g").onclick = function () {
    var n = Math.min(100, Math.max(1, +q("#n").value || 5));
    var list = [];
    for (var i = 0; i < n; i++) list.push(uuid4());
    q("#out").className = "output ok";
    q("#out").innerText = list.join("\n");
  };
  q("#cp").onclick = copyOut;
});

// 6. JWT 解码
tool("jwt", "JWT 解码", function () {
  h('<h1>JWT 解码</h1><div class="desc">查看 Header / Payload / 签名，自动换算 exp / iat 时间（纯本地解码，不验证签名）</div>'
    + '<textarea id="s" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"></textarea>'
    + '<div class="row"><button class="btn" id="go">解码</button></div>'
    + '<div class="output" id="out"></div>'
    + '<div class="row"><button class="btn ghost" id="cp">复制结果</button></div>');
  function b64u(s) { return s.replace(/-/g, "+").replace(/_/g, "/"); }
  function dec(seg) { return JSON.parse(decodeURIComponent(escape(atob(b64u(seg))))); }
  function ts(pl, k) {
    if (typeof pl[k] !== "number") return "";
    var d = new Date(pl[k] * 1000);
    return "\n" + k + " 对应时间  " + d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate())
      + " " + p2(d.getHours()) + ":" + p2(d.getMinutes()) + ":" + p2(d.getSeconds());
  }
  q("#go").onclick = function () {
    var parts = q("#s").value.trim().replace(/^Bearer\s+/i, "").split(".");
    if (parts.length < 2) {
      q("#out").className = "output err";
      q("#out").innerText = "X 格式无效：应为 header.payload.signature 三段（以 . 分隔）";
      return;
    }
    var head, pl;
    try { head = dec(parts[0]); } catch (e) {
      q("#out").className = "output err"; q("#out").innerText = "X Header 解码失败（不是合法 Base64URL）"; return;
    }
    try { pl = dec(parts[1]); } catch (e) {
      q("#out").className = "output err"; q("#out").innerText = "X Payload 解码失败（不是合法 Base64URL）"; return;
    }
    var status = "";
    if (typeof pl.exp === "number") {
      status = "\n\n过期状态  " + (pl.exp * 1000 < Date.now() ? "⚠ 已过期" : "✓ 未过期");
    }
    q("#out").className = "output ok";
    q("#out").innerText = "Header\n" + JSON.stringify(head, null, 2)
      + "\n\nPayload\n" + JSON.stringify(pl, null, 2)
      + ts(pl, "iat") + ts(pl, "nbf") + ts(pl, "exp") + status
      + "\n\nSignature\n" + (parts[2] || "(无)");
  };
  q("#s").oninput = function () { if (q("#s").value.trim()) q("#go").click(); };
  q("#cp").onclick = copyOut;
});

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
  h('<h1>正则表达式测试</h1><div class="desc">实时高亮，内置常用正则库，可从示例生成</div>'
    + '<div class="row"><label>常用 <select id="lib" style="width:150px"><option value="">选择…</option></select></label>'
    + '<button class="btn ghost" id="gen">从示例生成正则</button>'
    + '<span class="desc" style="margin:0">文本框每行放一个示例</span></div>'
    + '<label>正则</label><input type="text" id="re" value="\\d+">'
    + '<div class="row"><label><input type="checkbox" id="ig" checked> 忽略大小写</label>'
    + '<label><input type="checkbox" id="gl" checked> 全局</label>'
    + '<label><input type="checkbox" id="mu"> 多行</label></div>'
    + '<textarea id="s">订单A100、订单B233、订单C99</textarea>'
    + '<div class="output" id="out"></div>'
    + '<div class="row"><button class="btn ghost" id="cp">复制结果</button></div>');
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function clsOf(ch) {
    if (ch >= "0" && ch <= "9") return "\\d";
    if (ch >= "a" && ch <= "z") return "[a-z]";
    if (ch >= "A" && ch <= "Z") return "[A-Z]";
    if (ch >= "\u4e00" && ch <= "\u9fa5") return "[\\u4e00-\\u9fa5]";
    return null;
  }
  function patOf(line) {
    var out = "", cls = null, n = 0;
    function flush() { if (cls) { out += cls + (n > 1 ? "{" + n + "}" : ""); cls = null; n = 0; } }
    for (var i = 0; i < line.length; i++) {
      var c = clsOf(line[i]);
      if (c === null) { flush(); out += escRe(line[i]); }
      else if (c === cls) n++;
      else { flush(); cls = c; n = 1; }
    }
    flush();
    return out;
  }
  function tokens(p) { return p.match(/\\[dswDSW]|\[[^\]]*\](?:\{\d+\})?|\\.|./g) || []; }
  RE_LIB.forEach(function (item, i) {
    var o = document.createElement("option");
    o.value = String(i);
    o.textContent = item[0];
    q("#lib").appendChild(o);
  });
  q("#lib").onchange = function () {
    if (q("#lib").value === "") return;
    q("#re").value = RE_LIB[+q("#lib").value][1];
    run();
  };
  q("#gen").onclick = function () {
    var lines = q("#s").value.split(/\r?\n/).map(function (l) { return l.trim(); })
      .filter(Boolean).slice(0, 20);
    if (!lines.length) return;
    var pats = lines.map(patOf);
    var merged = pats[0];
    for (var k = 1; k < pats.length; k++) {
      var a = tokens(merged), b = tokens(pats[k]), m = "";
      var n2 = Math.min(a.length, b.length);
      for (var i = 0; i < n2; i++) m += a[i] === b[i] ? a[i] : ".";
      if (a.length !== b.length) m += ".*";
      merged = m;
    }
    q("#re").value = merged;
    run();
  };
  function run() {
    var flags = (q("#ig").checked ? "i" : "") + (q("#gl").checked ? "g" : "") + (q("#mu").checked ? "m" : "");
    var re;
    try { re = new RegExp(q("#re").value, flags); }
    catch (e) {
      q("#out").className = "output err";
      q("#out").innerText = "X " + e.message;
      return;
    }
    var txt = q("#s").value;
    var reG = new RegExp(re.source, flags.indexOf("g") >= 0 ? flags : flags + "g");
    var ms = [], m;
    while ((m = reG.exec(txt)) !== null) {
      ms.push(m);
      if (m[0] === "") reG.lastIndex++;
    }
    if (!ms.length) {
      q("#out").className = "output err";
      q("#out").innerText = "无匹配（0 处）";
      return;
    }
    var last = 0, html = "";
    for (var i = 0; i < ms.length; i++) {
      html += esc(txt.slice(last, ms[i].index)) + "【" + esc(ms[i][0]) + "】";
      last = ms[i].index + ms[i][0].length;
    }
    html += esc(txt.slice(last));
    q("#out").className = "output ok";
    q("#out").innerHTML = html + "<br><br>共 " + ms.length + " 处匹配";
  }
  ["re", "s", "ig", "gl", "mu"].forEach(function (id) {
    q("#" + id).oninput = run;
    q("#" + id).onchange = run;
  });
  q("#cp").onclick = copyOut;
  run();
});

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
});

// 9. Hash
tool("hash", "哈希计算", function () {
  h('<h1>哈希计算</h1><div class="desc">MD5 / SHA-1 / SHA-256 / SHA-512（纯 JS 实现，http 环境也可用）</div>'
    + '<textarea id="s" placeholder="输入文本"></textarea>'
    + '<div class="row"><button class="btn" id="go">计算</button></div>'
    + '<div class="output" id="out"></div>'
    + '<div class="row"><button class="btn ghost" id="cp">复制结果</button></div>');
  q("#go").onclick = function () {
    var data = new TextEncoder().encode(q("#s").value);
    q("#out").className = "output ok";
    q("#out").innerText = "MD5:     " + md5(data) + "\nSHA-1:   " + sha1(data) + "\nSHA-256: " + sha256(data) + "\nSHA-512: " + sha512(data);
  };
  q("#go").click();
  q("#cp").onclick = copyOut;
});

// 10. Color
var COLOR_NAMES = {
  black: "#000000", white: "#ffffff", red: "#ff0000", green: "#008000", blue: "#0000ff",
  yellow: "#ffff00", orange: "#ffa500", purple: "#800080", pink: "#ffc0cb", gray: "#808080",
  grey: "#808080", cyan: "#00ffff", magenta: "#ff00ff", brown: "#a52a2a", navy: "#000080",
  teal: "#008080", olive: "#808000", lime: "#00ff00", indigo: "#4b0082", violet: "#ee82ee",
  gold: "#ffd700", silver: "#c0c0c0", skyblue: "#87ceeb", coral: "#ff7f50", salmon: "#fa8072",
  tomato: "#ff6347", khaki: "#f0e68c", beige: "#f5f5dc", ivory: "#fffff0", snow: "#fffafa"
};
tool("color", "颜色转换", function () {
  h('<h1>颜色转换</h1><div class="desc">支持 #hex / rgb() / hsl() / 颜色名，点击行复制，色阶可点选</div>'
    + '<div class="row"><input type="color" id="pick" value="#38bdf8" style="width:80px;height:38px;border:none;background:none;cursor:pointer">'
    + '<input type="text" id="hex" value="#38bdf8" style="flex:1" placeholder="#38bdf8 / rgb(56,189,248) / hsl(199,93%,60%) / skyblue">'
    + '<button class="btn" id="go">转换</button></div>'
    + '<div class="swatch" id="sw" style="margin-top:10px;background:#38bdf8"></div>'
    + '<div class="output" id="out"></div>'
    + '<div class="shades" id="shades"></div>'
    + '<div class="row"><button class="btn ghost" id="cp">复制结果</button></div>');
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
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    var hh = 0, s = 0, l = (mx + mn) / 2;
    if (mx !== mn) {
      var d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) hh = (g - b) / d + (g < b ? 6 : 0);
      else if (mx === g) hh = (b - r) / d + 2;
      else hh = (r - g) / d + 4;
      hh = Math.round(hh * 60);
    }
    return [hh, Math.round(s * 100), Math.round(l * 100)];
  }
  function conv() {
    var rgb = parseColor(q("#hex").value);
    if (!rgb) {
      q("#out").className = "output err";
      q("#out").innerText = "X 无法识别，支持 #hex / rgb() / hsl() / 颜色名";
      q("#shades").innerHTML = "";
      return;
    }
    var r = rgb[0], g = rgb[1], b = rgb[2];
    var hx = "#" + [r, g, b].map(function (v) { return v.toString(16).padStart(2, "0"); }).join("");
    q("#sw").style.background = hx;
    q("#pick").value = hx;
    var hsl = rgb2hsl(r, g, b);
    var lum = ((r * 299 + g * 587 + b * 114) / 1000).toFixed(1);
    var lines = [
      ["HEX   " + hx.toUpperCase(), hx],
      ["RGB   rgb(" + r + ", " + g + ", " + b + ")", "rgb(" + r + ", " + g + ", " + b + ")"],
      ["HSL   hsl(" + hsl[0] + ", " + hsl[1] + "%, " + hsl[2] + "%)", "hsl(" + hsl[0] + ", " + hsl[1] + "%, " + hsl[2] + "%)"],
      ["亮度  " + lum + " / 255", lum]
    ];
    q("#out").className = "output ok";
    q("#out").innerHTML = lines.map(function (l) {
      return '<div class="copyline" data-c="' + esc(l[1]) + '">' + esc(l[0]) + '</div>';
    }).join("");
    var sh = "";
    for (var i = 0; i <= 10; i++) {
      var L = 95 - i * 9;
      var c = hsl2rgb(hsl[0], hsl[1], L);
      var chx = "#" + c.map(function (v) { return v.toString(16).padStart(2, "0"); }).join("");
      sh += '<div class="shade" data-c="' + chx + '" style="background:' + chx + '" title="L=' + L + '% ' + chx + '"></div>';
    }
    q("#shades").innerHTML = sh;
    Array.prototype.forEach.call(q("#out").querySelectorAll(".copyline"), function (el) {
      el.onclick = function () { copyText(el.getAttribute("data-c")); };
    });
    Array.prototype.forEach.call(q("#shades").querySelectorAll(".shade"), function (el) {
      el.onclick = function () { copyText(el.getAttribute("data-c")); };
    });
  }
  q("#pick").oninput = function () { q("#hex").value = q("#pick").value; conv(); };
  q("#go").onclick = conv;
  q("#cp").onclick = copyOut;
  conv();
});

// ---- Boot:导航按钮 + 图标 ----
var ICONS = { json: "{}", ts: "⏱", b64: "64", url: "%", uuid: "ID", jwt: "J", re: ".*", diff: "±", hash: "#", color: "◐" };
var navBtns = [];
TOOLS.forEach(function (t) {
  var b = document.createElement("button");
  b.innerHTML = '<span class="ico">' + ICONS[t.id] + "</span>" + esc(t.name);
  b.onclick = function () { openTool(t.id); };
  nav.appendChild(b);
  navBtns.push(b);
});

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
