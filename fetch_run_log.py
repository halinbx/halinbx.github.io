import json, urllib.request, sys

HDR = {'User-Agent': 'curl/8.0'}

def get(url):
    req = urllib.request.Request(url, headers=HDR)
    return json.load(urllib.request.urlopen(req, timeout=25))

rs = get('https://api.github.com/repos/halinbx/halinbx.github.io/actions/runs?per_page=8')
dns_runs = [r for r in rs['workflow_runs'] if 'dnscheck' in (r['name'] or '').lower() or 'DNS' in (r['name'] or '')]
if not dns_runs:
    print('no dnscheck run found'); sys.exit(1)
r = dns_runs[0]
print('RUN:', r['name'], r['status'], r['conclusion'], 'id=', r['id'])
jobs = get(f"https://api.github.com/repos/halinbx/halinbx.github.io/actions/runs/{r['id']}/jobs")
for j in jobs['jobs']:
    print('JOB:', j['name'], '=>', j['conclusion'])
    for s in j['steps']:
        print('  STEP:', s['name'], '=>', s['conclusion'])
    # grab failed step logs
    for s in j['steps']:
        if s['conclusion'] == 'failure':
            print('---- LOG for failed step:', s['name'])
            try:
                req = urllib.request.Request(j['id'] and f"https://api.github.com/repos/halinbx/halinbx.github.io/actions/jobs/{j['id']}/logs", headers=HDR)
                with urllib.request.urlopen(req, timeout=25) as resp:
                    txt = resp.read().decode('utf-8', 'ignore')
                    # print tail portion
                    lines = txt.splitlines()
                    for ln in lines[-80:]:
                        print(ln[:300])
            except Exception as e:
                print('log fetch err:', e)