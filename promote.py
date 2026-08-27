# -*- coding: utf-8 -*-
"""推广辅助:GitHub 仓库优化 + 状态查询"""
import json, os, subprocess
import urllib.request, urllib.error

env = dict(os.environ, GIT_TERMINAL_PROMPT="0", GCM_INTERACTIVE="never")
r = subprocess.run(["git", "credential", "fill"],
                   input=("protocol=https" + chr(10) + "host=github.com" + chr(10) + chr(10)).encode(),
                   capture_output=True, env=env)
cred = dict(l.split("=", 1) for l in r.stdout.decode("utf-8", "replace").splitlines() if "=" in l)
tok = cred.get("password", "")
print("token len:", len(tok))

API = "https://api.github.com/repos/halinbx/halinbx.github.io"
HDRS = {"Authorization": "Bearer " + tok, "Accept": "application/vnd.github+json",
        "User-Agent": "x", "Content-Type": "application/json"}


def req(url, data=None, method=None):
    rq = urllib.request.Request(url, data=json.dumps(data).encode() if data else None,
                                method=method or ("PATCH" if data else "GET"), headers=HDRS)
    try:
        body = urllib.request.urlopen(rq, timeout=30).read().decode()
        return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        print("ERR", e.code, e.read().decode("utf-8", "replace")[:200])
        return {}


# 1. 优化仓库可见度:描述 + 主页 + topics(搜索曝光核心)
repo = req(API, {"description": "测试工具大全 owntools.cn — 20+ 免费在线开发/测试工具,纯前端实现,数据不上传",
                 "homepage": "https://owntools.cn"})
print("repo desc:", repo.get("description"))
print("repo home:", repo.get("homepage"))

topics = req(API + "/topics", {"names": ["online-tools", "dev-tools", "json-formatter", "timestamp",
                                          "regex-tester", "base64", "uuid", "diff", "hash",
                                          "static-site", "github-pages", "test-tools"]}, "PUT")
print("topics:", topics.get("names"))

# 2. Pages 状态
pages = req(API + "/pages")
if pages:
    print("pages: cname =", pages.get("cname"), "| https_enforced =", pages.get("https_enforced"),
          "| status =", pages.get("status"))

# 3. 仓库访问数据(克隆/访客热度,反映仓库侧推广效果)
traffic = req(API + "/traffic/views")
if traffic:
    print("repo views: ", traffic.get("count"), "次 /", traffic.get("uniques"), "人 / 14天")
clones = req(API + "/traffic/clones")
if clones:
    print("repo clones:", clones.get("count"), "次 /", clones.get("uniques"), "人 / 14天")
