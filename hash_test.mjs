import { createHash } from "node:crypto";

function rotl(x, n) { return ((x << n) | (x >>> (32 - n))) >>> 0; }
function rotr(x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0; }
function hex8(x) { return ("00000000" + (x >>> 0).toString(16)).slice(-8); }
function pad(msg) {
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
  var p = pad(msg);
  var h = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
  var w = new Uint32Array(80);
  for (var i = 0; i < p.blocks; i++) {
    for (var j = 0; j < 16; j++) w[j] = p.dv.getUint32(i * 64 + j * 4);
    for (var j = 16; j < 80; j++) w[j] = rotl(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
    var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4];
    for (var j = 0; j < 80; j++) {
      var f, k;
      if (j < 20) { f = (b & c) | (~b & d); k = 0x5A827999; }
      else if (j < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
      else if (j < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
      else { f = b ^ c ^ d; k = 0xCA62C1D6; }
      var t = (rotl(a, 5) + f + e + k + w[j]) >>> 0;
      e = d; d = c; c = rotl(b, 30); b = a; a = t;
    }
    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0; h[4] = (h[4] + e) >>> 0;
  }
  return h.map(hex8).join("");
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
  var p = pad(msg);
  var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  var w = new Uint32Array(64);
  for (var i = 0; i < p.blocks; i++) {
    for (var j = 0; j < 16; j++) w[j] = p.dv.getUint32(i * 64 + j * 4);
    for (var j = 16; j < 64; j++) {
      var s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3);
      var s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0;
    }
    var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], hh = H[7];
    for (var j = 0; j < 64; j++) {
      var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      var ch = (e & f) ^ (~e & g);
      var t1 = (hh + S1 + ch + K[j] + w[j]) >>> 0;
      var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      var maj = (a & b) ^ (a & c) ^ (b & c);
      var t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + hh) >>> 0;
  }
  return H.map(hex8).join("");
}

var te = new TextEncoder();
var cases = ["", "abc", "你好世界", "The quick brown fox jumps over the lazy dog"];
[55, 56, 63, 64, 65, 119, 120, 200].forEach(function (n) { cases.push("a".repeat(n)); });
var fail = 0;
cases.forEach(function (s) {
  var bytes = te.encode(s);
  var mine1 = sha1(bytes);
  var ref1 = createHash("sha1").update(s, "utf8").digest("hex");
  var mine2 = sha256(bytes);
  var ref2 = createHash("sha256").update(s, "utf8").digest("hex");
  var ok1 = mine1 === ref1, ok2 = mine2 === ref2;
  if (!ok1 || !ok2) fail++;
  console.log("len=" + s.length + " sha1:" + (ok1 ? "OK" : "FAIL " + mine1 + " != " + ref1)
    + " sha256:" + (ok2 ? "OK" : "FAIL " + mine2 + " != " + ref2));
});
console.log(fail === 0 ? "ALL PASS" : fail + " FAILURES");