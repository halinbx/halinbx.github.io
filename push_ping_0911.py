# -*- coding: utf-8 -*-
"""9/11 补充推送:Bing/Google sitemap ping(免登录自动通道)"""
import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')

pings = [
    ("Bing sitemap ping", "https://www.bing.com/ping?sitemap=https%3A%2F%2Fowntools.cn%2Fsitemap.xml"),
    ("Google sitemap ping", "https://www.google.com/ping?sitemap=https%3A%2F%2Fowntools.cn%2Fsitemap.xml"),
]
for name, url in pings:
    r = subprocess.run(['curl', '-sL', '--max-time', '25', url], capture_output=True)
    body = r.stdout.decode('utf-8', 'replace').strip()
    print(f"== {name} ==")
    print(body[:300] if body else "(空响应)")
    print()