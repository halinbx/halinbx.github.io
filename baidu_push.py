# -*- coding: utf-8 -*-
"""百度 API 推送:向 data.zz.baidu.com 提交 URL 列表(配额:每天可推送)"""
import io, sys, urllib.request, urllib.error

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

TOKEN = "knadDIOVEx2Icbhn"   # owntools.cn 的 API 推送 token
SITE = "https://owntools.cn"
# 当前 19 个工具的 hash 直达路由(与 js/app.js TOOLS 数组一致,2026/9/9 核对)
TOOL_HASHES = ["json", "ts", "b64", "url", "uuid", "jwt", "re", "diff", "hash",
               "color", "radix", "wc", "case", "pwd", "htmlent", "unit",
               "datecalc", "ip", "qr"]
URLS = ["https://owntools.cn/"] + ["https://owntools.cn/#" + h for h in TOOL_HASHES]

body = "\n".join(URLS).encode("utf-8")
api = "http://data.zz.baidu.com/urls?site=%s&token=%s" % (SITE, TOKEN)

rq = urllib.request.Request(api, data=body, method="POST",
                            headers={"Content-Type": "text/plain",
                                     "User-Agent": "curl/8.0"})
try:
    with urllib.request.urlopen(rq, timeout=30) as r:
        print("HTTP", r.status)
        print(r.read().decode("utf-8", "replace"))
except urllib.error.HTTPError as e:
    print("HTTP", e.code)
    print(e.read().decode("utf-8", "replace")[:500])
except Exception as e:
    print("ERR:", e)