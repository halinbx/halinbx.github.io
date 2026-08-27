# -*- coding: utf-8 -*-
import subprocess, os, json, urllib.request, urllib.error

env = dict(os.environ, GIT_TERMINAL_PROMPT="0", GCM_INTERACTIVE="never", GCM_INTERACTIVE_1="never")
r = subprocess.run(["git", "credential", "fill"], input=b"protocol=https\nhost=github.com\n\n",
                   capture_output=True, env=env)
cred = dict(l.split("=", 1) for l in r.stdout.decode("utf-8", "replace").splitlines() if "=" in l)
token = cred.get("password", "")
if not token:
    print("NO_TOKEN")
    raise SystemExit(2)
print("token len:", len(token))

req = urllib.request.Request(
    "https://api.github.com/repos/halinbx/halinbx.github.io/actions/workflows/deploy.yml/dispatches",
    data=json.dumps({"ref": "main"}).encode(), method="POST",
    headers={"Authorization": "Bearer " + token, "Accept": "application/vnd.github+json",
             "User-Agent": "dispatch", "Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        print("DISPATCH OK", resp.status)
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read().decode("utf-8", "replace")[:300])