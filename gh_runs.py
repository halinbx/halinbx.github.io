# -*- coding: utf-8 -*-
"""查询 GitHub Actions 运行状态 + 可选读取日志"""
import json, sys, time, urllib.request

sys.stdout.reconfigure(encoding='utf-8')
UA = {"User-Agent": "curl/8", "Accept": "application/vnd.github+json"}
REPO = "halinbx/halinbx.github.io"


def api(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.status, r.read().decode("utf-8", "replace")


# 等待运行启动(最多 5 轮 x 20s)
run = None
for i in range(6):
    code, body = api(f"https://api.github.com/repos/{REPO}/actions/runs?per_page=5")
    runs = json.loads(body).get("workflow_runs", [])
    bing = [r for r in runs if r["name"] == "Bing Index Check"]
    if bing:
        run = bing[0]
        print(f"[{i}] run {run['id']} status={run['status']} conclusion={run.get('conclusion')}")
        if run["status"] == "completed":
            break
    else:
        print(f"[{i}] 未发现 Bing Index Check 运行,现有: {[r['name'] for r in runs[:3]]}")
    time.sleep(20)

if not run:
    print("!! 运行未触发")
    sys.exit(1)

if run["status"] != "completed":
    print("!! 超时未完成,稍后重跑本脚本")
    sys.exit(1)

# 读 jobs -> 日志
code, body = api(f"https://api.github.com/repos/{REPO}/actions/runs/{run['id']}/jobs")
jobs = json.loads(body).get("jobs", [])
job_id = jobs[0]["id"] if jobs else None
print("job:", job_id, jobs[0]["conclusion"] if jobs else "-")

try:
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/actions/jobs/{job_id}/logs", headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        log = r.read().decode("utf-8", "replace")
    open("bing_action_log.txt", "w", encoding="utf-8").write(log)
    print("日志已存 bing_action_log.txt, 长度:", len(log))
    # 直接打印关键段
    for line in log.splitlines():
        if any(k in line for k in ("=====", "cite", "hits", "result__a", "HTTP ", "(no ", "owntools")):
            print(line[:160])
except Exception as e:
    print("日志读取失败:", e)