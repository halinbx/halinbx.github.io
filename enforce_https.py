# -*- coding: utf-8 -*-
"""启用 GitHub Pages 强制 HTTPS 并查看状态"""
import json, os, subprocess
import urllib.request, urllib.error

env = dict(os.environ, GIT_TERMINAL_PROMPT="0", GCM_INTERACTIVE="never")
r = subprocess.run(["git", "credential", "fill"],
                   input=("protocol=https" + chr(10) + "host=github.com" + chr(10) + chr(10)).encode(),
                   capture_output=True, env=env)
cred = dict(l.split("=", 1) for l in r.stdout.decode("utf-8", "replace").splitlines() if "=" in l)
tok = cred.get("password", "")
print("token len:", len(tok))

def put(data):
    rq = urllib.request.Request(
        "https://api.github.com/repos/halinbx/halinbx.github.io/pages",
        data=json.dumps(data).encode(), method="PUT",
        headers={"Authorization": "Bearer " + tok, "Accept": "application/vnd.github+json",
                 "User-Agent": "x", "Content-Type": "application/json"})
    try:
        return urllib.request.urlopen(rq, timeout=30).status, None
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")[:300]

st, msg = put({"https_enforced": True})
print("enforce https:", st, msg or "OK")

rq = urllib.request.Request(
    "https://api.github.com/repos/halinbx/halinbx.github.io/pages",
    headers={"Authorization": "Bearer " + tok, "Accept": "application/vnd.github+json",
             "User-Agent": "x"})
d = json.loads(urllib.request.urlopen(rq, timeout=30).read().decode())
print("pages cfg: cname =", d.get("cname"), "| https_enforced =", d.get("https_enforced"),
      "| status =", d.get("status"))