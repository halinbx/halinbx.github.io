# -*- coding: utf-8 -*-
"""通过 api.github.com 推送本地最新 commit(绕过被阻断的 github.com 主站)。
原理:用 Git Data API 在远端重建与本地完全相同的 commit 对象,SHA 一致,等价于 git push。"""
import subprocess, json, base64, os, sys
import urllib.request, urllib.error
from datetime import datetime, timezone, timedelta

CWD = r"D:/Code/测试工具大全"
API = "https://api.github.com/repos/halinbx/halinbx.github.io"


def run_git(*args):
    r = subprocess.run(["git"] + list(args), capture_output=True, cwd=CWD)
    if r.returncode != 0:
        raise RuntimeError("git %s 失败: %s" % (" ".join(args), r.stderr.decode("utf-8", "replace")))
    return r.stdout


# ---------- 1. 从凭据管理器取 token(不打印明文) ----------
env = dict(os.environ, GIT_TERMINAL_PROMPT="0", GCM_INTERACTIVE="never", GCM_INTERACTIVE_1="never")
r = subprocess.run(["git", "credential", "fill"], input=b"protocol=https\nhost=github.com\n\n",
                   capture_output=True, env=env)
cred = dict(line.split("=", 1) for line in r.stdout.decode("utf-8", "replace").splitlines() if "=" in line)
token = cred.get("password", "")
username = cred.get("username", "")
if not token:
    print("NO_TOKEN: 凭据管理器中没有 github.com 的凭据")
    sys.exit(2)
print("已取得凭据 (用户: %s, token 长度: %d)" % (username, len(token)))


def api(method, path, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method, headers={
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "User-Agent": "push-via-api",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        raise RuntimeError("HTTP %s %s: %s" % (e.code, path, e.read().decode("utf-8", "replace")[:300]))


# ---------- 2. 读取本地 commit 信息 ----------
head = run_git("rev-parse", "HEAD").decode().strip()
parent = run_git("rev-parse", "HEAD^").decode().strip()
local_tree = run_git("rev-parse", "HEAD^{tree}").decode().strip()
raw = run_git("cat-file", "commit", "HEAD").decode("utf-8")
header, _, message = raw.partition("\n\n")
meta = {}
for line in header.splitlines():
    if " " in line:
        k, v = line.split(" ", 1)
        meta[k] = v


def parse_person(s):
    """'Name <email> 1761283820 +0800' -> API 的 author/committer 结构"""
    lt = s.rindex(">")
    name = s[: s.index(" <")]
    email = s[s.index("<") + 1: lt]
    ts, tz = s[lt + 2:].split()
    sign = 1 if tz[0] == "+" else -1
    off = timedelta(hours=int(tz[1:3]), minutes=int(tz[3:5])) * sign
    return {"name": name, "email": email,
            "date": datetime.fromtimestamp(int(ts), timezone(off)).isoformat()}


author = parse_person(meta["author"])
committer = parse_person(meta["committer"])
files = [f for f in run_git("diff", "--name-only", parent, head).decode().splitlines() if f]
print("本地 HEAD: %s (基于 %s)" % (head, parent))
print("待推送文件:", files)

# ---------- 3. 远端当前 ref ----------
remote_head = api("GET", "/git/ref/heads/main")["object"]["sha"]
print("远端 main: %s" % remote_head)
if remote_head != parent:
    print("警告: 远端与本地父提交不一致(远端有新提交),将改为基于远端重建,稍后需 git pull --rebase 同步")

remote_tree = api("GET", "/git/commits/" + remote_head)["tree"]["sha"]

# ---------- 4. 重建 blob / tree / commit ----------
entries = []
for f in files:
    content = run_git("show", "HEAD:" + f)  # 从 commit 中读,避免工作区未保存改动
    blob = api("POST", "/git/blobs",
               {"content": base64.b64encode(content).decode(), "encoding": "base64"})
    entries.append({"path": f, "mode": "100644", "type": "blob", "sha": blob["sha"]})

tree = api("POST", "/git/trees", {"base_tree": remote_tree, "tree": entries})
new_commit = api("POST", "/git/commits",
                 {"message": message, "tree": tree["sha"], "parents": [remote_head],
                  "author": author, "committer": committer})
print("远端新 commit: %s" % new_commit["sha"])
if new_commit["sha"] == head:
    print("SHA 与本地完全一致,推送等价成功,本地无需任何同步")
else:
    print("提示: 与本地 SHA 不同,网络恢复后请执行 git pull --rebase")

# ---------- 5. 快进更新远端 ref ----------
api("PATCH", "/git/refs/heads/main", {"sha": new_commit["sha"], "force": False})
verify = api("GET", "/git/ref/heads/main")["object"]["sha"]
print("DONE 远端 main 已更新为:", verify)