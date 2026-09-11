# -*- coding: utf-8 -*-
"""查询 abacus PV 计数 9/2 起每日"""
import re, subprocess, sys, datetime
sys.stdout.reconfigure(encoding='utf-8')

start = datetime.date(2026, 9, 2)
today = datetime.date.today()
days = []
d = start
while d <= today:
    days.append(d.strftime('%Y%m%d'))
    d += datetime.timedelta(days=1)

for d in days:
    r = subprocess.run(['curl', '-sL', '--max-time', '25',
                        'https://abacus.jasoncameron.dev/hit/halinbx-testgo/pv-' + d],
                       capture_output=True)
    m = re.search(r'"value":\s*(\d+)', r.stdout.decode('utf-8', 'replace'))
    print(d, ':', m.group(1) if m else '?', 'PV')