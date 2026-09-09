# -*- coding: utf-8 -*-
"""IndexNow 推送:让 Bing/搜索引擎立即发现 HTTPS 版全站 URL。
密钥文件已部署在站点根目录:da5ee27746c04a0a897b6202eace1cff.txt"""
import json, urllib.request, urllib.error, io, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

KEY = "da5ee27746c04a0a897b6202eace1cff"
HOST = "owntools.cn"
# 当前 19 个工具的 hash 直达路由(与 js/app.js TOOLS 数组一致,2026/9/9 核对)
# 其中 ip/qr 需联网,其余 17 个纯前端
TOOL_HASHES = ["json", "ts", "b64", "url", "uuid", "jwt", "re", "diff", "hash",
               "color", "radix", "wc", "case", "pwd", "htmlent", "unit",
               "datecalc", "ip", "qr"]
URLS = ["https://owntools.cn/"] + ["https://owntools.cn/#" + h for h in TOOL_HASHES]

ENDPOINTS = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
]

body = json.dumps({"host": HOST, "key": KEY,
                   "keyLocation": "https://%s/%s.txt" % (HOST, KEY),
                   "urlList": URLS}).encode("utf-8")

for ep in ENDPOINTS:
    rq = urllib.request.Request(ep, data=body, method="POST",
                                headers={"Content-Type": "application/json; charset=utf-8",
                                         "User-Agent": "owntools-promote"})
    try:
        with urllib.request.urlopen(rq, timeout=30) as resp:
            print("%s -> HTTP %d (202/200 = 已接受)" % (ep, resp.status))
    except urllib.error.HTTPError as e:
        print("%s -> HTTP %d %s" % (ep, e.code, e.read().decode("utf-8", "replace")[:200]))
    except Exception as e:
        print("%s -> ERR %s" % (ep, e))

print("")
print("共推送 %d 个 HTTPS URL" % len(URLS))