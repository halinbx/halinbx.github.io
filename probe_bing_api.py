# -*- coding: utf-8 -*-
"""探测 Bing URL 提交 API 可用性:不同 siteUrl 格式 × 两个 API 域名"""
import json, urllib.request, urllib.parse, urllib.error, io, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
KEY = open("bing_key.txt", encoding="utf-8").read().strip()

sites = ["https://owntools.cn/", "https://owntools.cn", "owntools.cn"]
hosts = ["https://api.bing.com", "https://ssl.bing.com"]

for host in hosts:
    for site in sites:
        qs = urllib.parse.urlencode({"apikey": KEY, "siteUrl": site})
        url = host + "/webmaster/urlsubmission/geturlquota?" + qs
        rq = urllib.request.Request(url, headers={"User-Agent": "owntools-promote"})
        try:
            with urllib.request.urlopen(rq, timeout=20) as r:
                print("%s | %s -> %s" % (host.split("//")[1], site, r.read().decode()[:200]))
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace").replace("\n", " ")[:100]
            print("%s | %s -> HTTP %d %s" % (host.split("//")[1], site, e.code, msg))
        except Exception as e:
            print("%s | %s -> ERR %s" % (host.split("//")[1], site, e))