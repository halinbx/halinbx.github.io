# -*- coding: utf-8 -*-
"""创建 GitHub 个人主页 README 仓库(halinbx/halinbx),引流 owntools.cn"""
import json, os, subprocess
import urllib.request, urllib.error

env = dict(os.environ, GIT_TERMINAL_PROMPT="0", GCM_INTERACTIVE="never")
r = subprocess.run(["git", "credential", "fill"],
                   input=("protocol=https" + chr(10) + "host=github.com" + chr(10) + chr(10)).encode(),
                   capture_output=True, env=env)
cred = dict(l.split("=", 1) for l in r.stdout.decode("utf-8", "replace").splitlines() if "=" in l)
tok = cred.get("password", "")
print("token len:", len(tok))

HDRS = {"Authorization": "Bearer " + tok, "Accept": "application/vnd.github+json",
        "User-Agent": "x", "Content-Type": "application/json"}


def req(url, data=None, method=None):
    rq = urllib.request.Request(url, data=json.dumps(data).encode() if data else None,
                                method=method or ("PATCH" if data else "GET"), headers=HDRS)
    try:
        body = urllib.request.urlopen(rq, timeout=30).read().decode()
        return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        print("ERR", e.code, e.read().decode("utf-8", "replace")[:300])
        return {}


PROFILE_README = """## Hi there 👋

我是测试/开发工具爱好者,维护着一个免费在线工具箱:

### 🔧 [测试工具大全 · owntools.cn](https://owntools.cn)

**20+ 免费在线开发/测试工具**:JSON 格式化 · 时间戳转换 · 正则测试 · 文本 Diff · Base64 · 哈希计算 · UUID · 密码生成 · JWT 解析 · Cron 解析 · SQL/XML 格式化 ……

特点:
- ✅ 纯前端实现,数据**不上传服务器**
- ✅ 无广告、免登录,打开就用
- ✅ 支持中英双语,移动端适配

> 主仓库:[halinbx/halinbx.github.io](https://github.com/halinbx/halinbx.github.io) · 欢迎 Star ⭐
"""

# 1. 创建特殊仓库 halinbx/halinbx(公开)
repo = req("https://api.github.com/user/repos",
           {"name": "halinbx", "description": "GitHub 个人主页 · 在线工具箱 owntools.cn",
            "homepage": "https://owntools.cn", "private": False, "auto_init": False}, "POST")
print("create repo:", repo.get("full_name") or "(可能已存在)")

# 2. 写入 README.md(PUT contents API,自动创建初始 commit)
import base64
put = req("https://api.github.com/repos/halinbx/halinbx/contents/README.md",
          {"message": "init: personal profile README with owntools.cn",
           "content": base64.b64encode(PROFILE_README.encode("utf-8")).decode()}, "PUT")
print("readme commit:", (put.get("commit") or {}).get("sha", "")[:10] or "failed")

# 3. 验证
chk = req("https://api.github.com/repos/halinbx/halinbx")
print("repo:", chk.get("full_name"), "| home:", chk.get("homepage"), "| desc:", chk.get("description"))