# -*- coding: utf-8 -*-
"""9/14 Bing API 第 3 天 400,测试参数/路径变体找正确姿势"""
import json, urllib.request, urllib.parse, urllib.error, io, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
KEY = open("bing_key.txt", encoding="utf-8").read().strip()

def try_get(label, url):
    rq = urllib.request.Request(url, headers={"User-Agent": "owntools-promote"})
    try:
        with urllib.request.urlopen(rq, timeout=20) as r:
            print("%-40s -> %d %s" % (label, r.status, r.read().decode()[:150]))
    except urllib.error.HTTPError as e:
        print("%-40s -> HTTP %d %s" % (label, e.code, e.read().decode("utf-8", "replace").replace("\n", " ")[:90]))
    except Exception as e:
        print("%-40s -> ERR %s" % (label, e))

# 1) 参数名变体:apikey / apiKey / ApiKey
for p in ["apikey", "apiKey"]:
    qs = urllib.parse.urlencode({p: KEY, "siteUrl": "https://owntools.cn"})
    try_get("quota param=" + p, "https://api.bing.com/webmaster/urlsubmission/geturlquota?" + qs)

# 2) 路径变体:getUrlQuota 驼峰
qs = urllib.parse.urlencode({"apikey": KEY, "siteUrl": "https://owntools.cn"})
try_get("quota path=getUrlQuota", "https://api.bing.com/webmaster/urlsubmission/getUrlQuota?" + qs)

# 3) 不带 siteUrl
try_get("quota no-siteUrl", "https://api.bing.com/webmaster/urlsubmission/geturlquota?apikey=" + KEY)

# 4) 故意的坏 key(对照:若同样 400 页面,说明 400 与 key 无关,是服务整体故障)
qs = urllib.parse.urlencode({"apikey": "0" * 32, "siteUrl": "https://owntools.cn"})
try_get("quota BADKEY(对照)", "https://api.bing.com/webmaster/urlsubmission/geturlquota?" + qs)

# 5) POST 提交变体:key 放 body 而非 query
body = json.dumps({"siteUrl": "https://owntools.cn", "urlList": ["https://owntools.cn/"], "apikey": KEY}).encode()
rq = urllib.request.Request("https://api.bing.com/webmaster/urlsubmission/submiturlbatch", data=body, method="POST",
                            headers={"Content-Type": "application/json; charset=utf-8"})
try:
    with urllib.request.urlopen(rq, timeout=20) as r:
        print("%-40s -> %d %s" % ("POST key-in-body", r.status, r.read().decode()[:150]))
except urllib.error.HTTPError as e:
    print("%-40s -> HTTP %d %s" % ("POST key-in-body", e.code, e.read().decode("utf-8", "replace").replace("\n", " ")[:90]))