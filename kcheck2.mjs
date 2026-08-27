import { readFileSync } from "node:fs";

var primes = [];
var n = 2n;
while (primes.length < 80) {
  var isP = true;
  for (var i = 2n; i * i <= n; i++) if (n % i === 0n) { isP = false; break; }
  if (isP) primes.push(n);
  n++;
}
function icbrt(v) {
  var lo = 0n, hi = v;
  while (lo < hi) {
    var mid = (lo + hi + 1n) / 2n;
    if (mid * mid * mid <= v) lo = mid; else hi = mid - 1n;
  }
  return lo;
}
function isqrt(v) {
  var lo = 0n, hi = v;
  while (lo < hi) {
    var mid = (lo + hi + 1n) / 2n;
    if (mid * mid <= v) lo = mid; else hi = mid - 1n;
  }
  return lo;
}
var M64 = (1n << 64n) - 1n;
// K[j] = frac(cbrt(prime_j)) with 64 fractional bits: floor(cbrt(p * 2^192)) & M64
var K = primes.map(function (p) { return (icbrt(p << 192n) & M64).toString(16).padStart(16, "0"); });
// IV[i] = frac(sqrt(prime_i)) : floor(sqrt(p * 2^128)) & M64
var IV = primes.slice(0, 8).map(function (p) { return (isqrt(p << 128n) & M64).toString(16).padStart(16, "0"); });

var src = readFileSync("t512.mjs", "utf8");
var km = src.match(/var K = \[([\s\S]*?)\];/);
var mineK = km[1].split(",").map(function (s) { return s.trim().replace(/^0x/, "").replace(/n$/, ""); });
var hm = src.match(/var H = \[([\s\S]*?)\];/);
var mineH = hm[1].split(",").map(function (s) { return s.trim().replace(/^0x/, "").replace(/n$/, ""); });

var bad = 0;
for (var i = 0; i < 80; i++) {
  var want = K[i];
  if (mineK[i] !== want) { console.log("K[" + i + "] MINE=" + mineK[i] + " WANT=" + want); bad++; }
}
console.log("--- IV ---");
for (var i = 0; i < 8; i++) {
  var want = IV[i];
  if (mineH[i] !== want) { console.log("H[" + i + "] MINE=" + mineH[i] + " WANT=" + want); bad++; }
}
console.log(bad === 0 ? "ALL CONSTANTS OK" : bad + " BAD CONSTANTS");