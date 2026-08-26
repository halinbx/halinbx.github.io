"use strict";

const nav = document.getElementById("nav");
const main = document.getElementById("main");
const TOOLS = [];

function tool(id, name, render) { TOOLS.push({ id: id, name: name, render: render }); }
function h(html) { main.innerHTML = html; }
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
    if (!btn) return;
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
  setInterval(tick, 1000);
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

// 6. Password
tool("pwd", "随机密码生成", function () {
  h('<h1>随机密码生成</h1><div class="desc">本地随机，强度预估</div>'
    + '<div class="row"><label>长度 <input type="text" id="len" value="16" style="width:70px"></label>'
    + '<label><input type="checkbox" id="u" checked> 大写</label>'
    + '<label><input type="checkbox" id="lo" checked> 小写</label>'
    + '<label><input type="checkbox" id="num" checked> 数字</label>'
    + '<label><input type="checkbox" id="sym" checked> 符号</label>'
    + '<button class="btn" id="g">生成</button></div>'
    + '<div class="output" id="out"></div>'
    + '<div class="row"><button class="btn ghost" id="cp">复制结果</button></div>');
  q("#g").onclick = function () {
    var pool = "";
    if (q("#u").checked) pool += "ABCDEFGHJKLMNPQRSTUVWXYZ";
    if (q("#lo").checked) pool += "abcdefghijkmnopqrstuvwxyz";
    if (q("#num").checked) pool += "23456789";
    if (q("#sym").checked) pool += "!@#$%^&*()-_=+[]{}";
    if (!pool) {
      q("#out").className = "output err";
      q("#out").innerText = "X 至少选择一种字符集";
      return;
    }
    var len = Math.min(64, Math.max(6, +q("#len").value || 16));
    var arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    var pwd = "";
    for (var i = 0; i < len; i++) pwd += pool[arr[i] % pool.length];
    var bits = Math.round(len * Math.log2(pool.length));
    var lv = bits < 50 ? "弱" : bits < 80 ? "中等" : bits < 120 ? "强" : "极强";
    var tip = "";
    if (!q("#u").checked && !q("#lo").checked) {
      tip = "\n\n⚠ 提示:当前未勾选大写/小写字母,密码仅由数字和符号组成(看起来像乱码属正常)。需要常规密码请勾选字母选项。";
    }
    q("#out").className = "output ok";
    q("#out").innerText = pwd + "\n\n熵约 " + bits + " bits - " + lv + tip;
  };
  q("#cp").onclick = copyOut;
});

// 7. Regex
tool("re", "正则表达式测试", function () {
  h('<h1>正则表达式测试</h1><div class="desc">实时高亮匹配结果</div>'
    + '<label>正则</label><input type="text" id="re" value="\\d+">'
    + '<div class="row"><label><input type="checkbox" id="ig" checked> 忽略大小写</label>'
    + '<label><input type="checkbox" id="gl" checked> 全局</label>'
    + '<label><input type="checkbox" id="mu"> 多行</label></div>'
    + '<textarea id="s">订单A100、订单B233、订单C99</textarea>'
    + '<div class="output" id="out"></div>'
    + '<div class="row"><button class="btn ghost" id="cp">复制结果</button></div>');
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
  h('<h1>哈希计算</h1><div class="desc">SHA-1 / SHA-256 / SHA-512（Web Crypto）</div>'
    + '<textarea id="s" placeholder="输入文本"></textarea>'
    + '<div class="row"><button class="btn" id="go">计算</button></div>'
    + '<div class="output" id="out"></div>'
    + '<div class="row"><button class="btn ghost" id="cp">复制结果</button></div>');
  q("#go").onclick = async function () {
    var data = new TextEncoder().encode(q("#s").value);
    var res = [];
    for (var k = 0; k < 3; k++) {
      var alg = ["SHA-1", "SHA-256", "SHA-512"][k];
      var buf = await crypto.subtle.digest(alg, data);
      var hex = [];
      var bytes = new Uint8Array(buf);
      for (var i = 0; i < bytes.length; i++) hex.push(bytes[i].toString(16).padStart(2, "0"));
      res.push(alg + ":  " + hex.join(""));
    }
    q("#out").className = "output ok";
    q("#out").innerText = res.join("\n");
  };
  q("#cp").onclick = copyOut;
});

// 10. Color
tool("color", "颜色转换", function () {
  h('<h1>颜色转换</h1><div class="desc">HEX / RGB / HSL</div>'
    + '<div class="row"><input type="color" id="pick" value="#38bdf8" style="width:80px;height:38px;border:none;background:none;cursor:pointer">'
    + '<input type="text" id="hex" value="#38bdf8" style="width:140px">'
    + '<button class="btn" id="go">转换</button></div>'
    + '<div class="swatch" id="sw" style="margin-top:10px;background:#38bdf8"></div>'
    + '<div class="output" id="out"></div>'
    + '<div class="row"><button class="btn ghost" id="cp">复制结果</button></div>');
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
    var hex = q("#hex").value.trim();
    if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) {
      q("#out").className = "output err";
      q("#out").innerText = "X 请输入 6 位 HEX，如 #38bdf8";
      return;
    }
    hex = "#" + hex.replace("#", "");
    q("#sw").style.background = hex;
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    var hsl = rgb2hsl(r, g, b);
    q("#out").className = "output ok";
    q("#out").innerText = "HEX   " + hex.toUpperCase()
      + "\nRGB   rgb(" + r + ", " + g + ", " + b + ")"
      + "\nHSL   hsl(" + hsl[0] + ", " + hsl[1] + "%, " + hsl[2] + "%)"
      + "\n亮度  " + ((r * 299 + g * 587 + b * 114) / 1000).toFixed(1) + " / 255";
  }
  q("#pick").oninput = function () { q("#hex").value = q("#pick").value; conv(); };
  q("#go").onclick = conv;
  q("#cp").onclick = copyOut;
  conv();
});

// Boot
TOOLS.forEach(function (t) {
  var b = document.createElement("button");
  b.textContent = t.name;
  b.onclick = function () {
    var all = document.querySelectorAll("#nav button");
    for (var i = 0; i < all.length; i++) all[i].classList.remove("active");
    b.classList.add("active");
    t.render();
  };
  nav.appendChild(b);
});
nav.firstChild.click();
