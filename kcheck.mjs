import { readFileSync } from "node:fs";
// generate correct SHA-512 K constants: frac(cbrt(prime))^64
function cbrt(n) {
  // Newton for integer-ish
  var x = Math.cbrt(n);
  return x;
}
var primes = [];
var n = 2;
while (primes.length < 80) {
  var isP = true;
  for (var i = 2; i * i <= n; i++) if (n % i === 0) { isP = false; break; }
  if (isP) primes.push(n);
  n++;
}
// float cbrt loses precision; use BigInt integer method: cube root via binary search on scaled integers
function icbrt64(v) { // floor(cbrt(v)) for BigInt v
  var lo = 0n, hi = v;
  while (lo < hi) {
    var mid = (lo + hi + 1n) / 2n;
    if (mid * mid * mid <= v) lo = mid; else hi = mid - 1n;
  }
  return lo;
}
// frac(cbrt(p)) = cbrt(p) - floor(cbrt(p)); with p up to 409, use big scaling
var SCALE = 1n << 200n;
var K = primes.map(function (p) {
  var P = BigInt(p) * SCALE;
  var c = icbrt64(P); // scaled cbrt
  // take top 64 bits of fraction: (c mod SCALE) >> (200-64)
  var frac = c % SCALE;
  return (frac >> 136n).toString(16);
});
var src = readFileSync("t512.mjs", "utf8");
var m = src.match(/var K = \[([\s\S]*?)\];/);
var mine = m[1].split(",").map(function (s) { return s.trim().replace("0x", "").replace("n", ""); });
var bad = 0;
for (var i = 0; i < 80; i++) {
  var want = K[i].padStart(16, "0");
  if (mine[i] !== want) { console.log("K[" + i + "] MINE=" + mine[i] + " WANT=" + want); bad++; }
}
console.log(bad === 0 ? "K TABLE OK" : bad + " BAD K VALUES");