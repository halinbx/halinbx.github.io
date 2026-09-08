# -*- coding: utf-8 -*-
"""绕过 github.com 直连故障:走 api.github.com Git Data API 推送本地领先 commit 的文件"""
import base64
import json
import subprocess
import sys
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")

REPO = "halinbx/halinbx.github.io"
BRANCH = "main"

# 1) 从 git 凭据管理器取 token(不打印)
inp = "protocol=https\nhost=github.com\n\n"
p = subprocess.run(["git", "credential", "fill"], input=inp,
                   capture_output=True, text=True, timeout=20)
cred = dict(l.split("=", 1) for l in p.stdout.strip().splitlines() if "=" in l)
TOKEN = cred.get("password", "")
if not TOKEN:
    print("no token")
    sys.exit(1)


def api(method, path, body=None):
    url = f"https://api.github.com/repos/{REPO}/{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, method=method, data=data, headers={
        "Authorization": f"Bearer {TOKEN}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "push-api-script",
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        txt = r.read().decode()
        return r.status, json.loads(txt) if txt else None


# 2) 远端当前 HEAD
st, ref = api("GET", f"git/ref/heads/{BRANCH}")
head_sha = ref["object"]["sha"]
print("remote head:", head_sha[:7])

st, head_commit = api("GET", f"git/commits/{head_sha}")
base_tree = head_commit["tree"]["sha"]

# 3) 本地待推文件(在 commit a4c3b13 中)的内容
files = ["gh_result.py", "gh_runs.py", "今日推广步骤.md"]
tree_items = []
for f in files:
    blob = subprocess.run(["git", "show", f"a4c3b13:{f}"],
                          capture_output=True, timeout=15).stdout
    st, b = api("POST", "git/blobs", {
        "content": base64.b64encode(blob).decode(),
        "encoding": "base64",
    })
    tree_items.append({"path": f, "mode": "100644", "type": "blob", "sha": b["sha"]})
    print("blob ok:", f, b["sha"][:7])

# 4) 新 tree + commit
st, tree = api("POST", "git/trees", {"base_tree": base_tree, "tree": tree_items})
st, nc = api("POST", "git/commits", {
    "message": "docs: 9/8 bing final verdict via overseas runner + full day summary",
    "tree": tree["sha"],
    "parents": [head_sha],
})
print("new commit:", nc["sha"][:7])

# 5) 更新分支引用
st, upd = api("PATCH", f"git/refs/heads/{BRANCH}", {"sha": nc["sha"], "force": False})
print("branch updated ->", upd["object"]["sha"][:7], "OK")