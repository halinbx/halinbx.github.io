# -*- coding: utf-8 -*-
"""9/14 360 结果页深度分析"""
import urllib.request, gzip, io, sys, re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      "Accept-Language": "zh-CN,zh;q=0.9"}

rq = urllib.request.Request("https://www.so.com/s?q=site%3Aowntools.cn", headers=UA)
with urllib.request.urlopen(rq, timeout=25) as r:
    d = r.read()
    if r.headers.get("Content-Encoding") == "gzip":
        d = gzip.decompress(d)
html = d.decode("utf-8", "replace")

# 结果标题块
titles = re.findall(r'<h3[^>]*>(.*?)</h3>', html, re.S)
print("h3 块数量:", len(titles))
for t in titles[:15]:
    clean = re.sub(r'<[^>]+>', '', t).strip()
    if clean:
        print(" 标题:", clean[:80])

# 真实链接(cite/data-url)中的 owntools
links = re.findall(r'(?:data-url|cite|href)="(https?://[^"]*owntools[^"]*)"', html)
print("owntools 真实链接:", len(links), set(links[:5]) if links else "")
# 无结果提示
for kw in ["没有找到", "找不到", "未找到", "抱歉"]:
    if kw in html:
        print("含提示:", kw)