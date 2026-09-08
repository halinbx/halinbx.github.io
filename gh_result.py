# -*- coding: utf-8 -*-
"""等待 Actions 运行完成并从 raw.githubusercontent.com 读取 Bing 检查结果"""
import json, sys, time, urllib.request

sys.stdout.reconfigure(encoding='utf-8')
UA = {"User-Agent": "curl/8", "Accept": "application/vnd.github+json"}
REPO = "halinbx/halinbx.github.io"
RAW = f"https://raw.githubusercontent.com/{REPO}/main/.github/bing_check_result.txt"


def api(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read().decode("utf-8", "replace")


# 轮询等待新运行完成(最多 8 轮 x 20s = 160s)
done = False
for i in range(8):
    try:
        runs = json.loads(api(f"https://api.github.com/repos/{REPO}/actions/runs?per_page=3"))
        bing = [r for r in runs.get("workflow_runs", []) if r["name"] == "Bing Index Check"]
        if bing:
            r0 = bing[0]
            print(f"[{i}] run {r0['id']} {r0['status']} {r0.get('conclusion')} sha={r0['head_sha'][:7]}")
            if r0["status"] == "completed":
                done = (r0.get("conclusion") == "success")
                break
        else:
            print(f"[{i}] 尚无运行")
    except Exception as e:
        print(f"[{i}] err {e}")
    time.sleep(20)

if not done:
    print("!! 运行未成功完成")
    sys.exit(1)

# 等待 raw CDN 同步
for i in range(6):
    time.sleep(15)
    try:
        txt = api(RAW)
        open("bing_action_result.txt", "w", encoding="utf-8").write(txt)
        print("===== 结果 =====")
        print(txt)
        break
    except Exception as e:
        print(f"[raw {i}] {e}")