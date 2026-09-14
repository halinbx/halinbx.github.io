# -*- coding: utf-8 -*-
"""9/14 收录快查:百度/搜狗/360 site:owntools.cn"""
import urllib.request, gzip, io, sys, re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      "Accept-Language": "zh-CN,zh;q=0.9"}

def get(url):
    rq = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(rq, timeout=25) as r:
            d = r.read()
            if r.headers.get("Content-Encoding") == "gzip":
                d = gzip.decompress(d)
            return r.status, d.decode("utf-8", "replace")
    except Exception as e:
        return 0, str(e)

# 百度
st, html = get("https://www.baidu.com/s?wd=site%3Aowntools.cn")
if st:
    real = len(re.findall(r'owntools\.cn(?!.*百度为您找到)', "")) if False else html.count("owntools.cn")
    nores = ("很抱歉" in html) or ("没有找到" in html) or ("未找到相关结果" in html)
    print("百度: HTTP", st, "| 页面大小", len(html), "| owntools字样", real, "| 无结果提示", nores)
else:
    print("百度: 失败", html[:80])

# 搜狗
st, html = get("https://www.sogou.com/web?query=site%3Aowntools.cn")
if st:
    nores = ("没有找到" in html) or ("未找到" in html)
    print("搜狗: HTTP", st, "| 无结果提示", nores, "| 大小", len(html))
else:
    print("搜狗: 失败", html[:80])

# 360
st, html = get("https://www.so.com/s?q=site%3Aowntools.cn")
if st:
    nores = ("没有找到" in html) or ("找不到" in html)
    print("360: HTTP", st, "| 无结果提示", nores, "| 大小", len(html))
else:
    print("360: 失败", html[:80])