# -*- coding: utf-8 -*-
"""查询 GitHub Actions 最近构建状态,写入 runs.txt"""
import subprocess, os, json, urllib.request, io, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

env = dict(os.environ, GIT_TERMINAL_PROMPT="0")
r = subprocess.run(["git", "credential", "fill"], input=b"protocol=https\nhost=github.com\n\n",
                   capture_output=True, env=env)
cred = dict(l.split("=", 1) for l in r.stdout.decode("utf-8", "replace").splitlines() if "=" in l)
token = cred.get("password", "")

req = urllib.request.Request(
    "https://api.github.com/repos/halinbx/halinbx.github.io/actions/runs?per_page=5",
    headers={"Authorization": "Bearer " + token,
             "Accept": "application/vnd.github+json",
             "User-Agent": "check"})
d = json.loads(urllib.request.urlopen(req, timeout=30).read())

lines = []
for run in d["workflow_runs"]:
    lines.append("%s | %s | %s | %s | %s" % (
        run["name"], run["status"], run["conclusion"], run["head_sha"][:7], run["created_at"]))

with open("runs.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print("OK %d runs" % len(lines))