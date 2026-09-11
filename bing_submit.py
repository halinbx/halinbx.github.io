# -*- coding: utf-8 -*-
"""Bing 站长平台 URL 提交 API(9/11 拿到 key 后启用)
- 配额查询:GET  /webmaster/urlsubmission/geturlquota
- 批量提交:POST /webmaster/urlsubmission/submiturlbatch  (配额 10000 条/天)
- Key 存放在 bing_key.txt(已被 .gitignore 排除,不入库)
用法:python bing_submit.py  →  查配额 + 提交主页
      python bing_submit.py url1 url2 ...  →  自定义提交
"""
import json, urllib.request, urllib.parse, urllib.error, io, sys, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

KEY = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "bing_key.txt")).read().strip()
SITE = "https://owntools.cn"
API = "https://api.bing.com/webmaster/urlsubmission"

# hash 路由(#json 等)Bing 与主页视为同一页面,真正需要提交的只有主 URL
DEFAULT_URLS = ["https://owntools.cn/"]


def quota():
    qs = urllib.parse.urlencode({"apikey": KEY, "siteUrl": SITE})
    u = "%s/geturlquota?%s" % (API, qs)
    rq = urllib.request.Request(u, headers={"User-Agent": "owntools-promote"})
    with urllib.request.urlopen(rq, timeout=30) as r:
        print("配额:", json.dumps(json.loads(r.read().decode()), ensure_ascii=False))


def submit(urls):
    body = json.dumps({"siteUrl": SITE, "urlList": urls}).encode("utf-8")
    qs = urllib.parse.urlencode({"apikey": KEY})
    rq = urllib.request.Request("%s/submiturlbatch?%s" % (API, qs), data=body, method="POST",
                                headers={"Content-Type": "application/json; charset=utf-8",
                                         "User-Agent": "owntools-promote"})
    with urllib.request.urlopen(rq, timeout=30) as r:
        print("提交:", json.dumps(json.loads(r.read().decode()), ensure_ascii=False))


if __name__ == "__main__":
    try:
        quota()
    except Exception as e:
        print("配额查询失败:", e)
    urls = sys.argv[1:] or DEFAULT_URLS
    try:
        submit(urls)
        print("共提交 %d 个 URL: %s" % (len(urls), urls))
    except urllib.error.HTTPError as e:
        print("提交失败 HTTP %d: %s" % (e.code, e.read().decode("utf-8", "replace")[:300]))
    except Exception as e:
        print("提交失败:", e)