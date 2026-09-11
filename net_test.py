# -*- coding: utf-8 -*-
import socket

sys_out = open("net_test_result.txt", "w", encoding="utf-8")
for host in ["github.com", "api.github.com", "raw.githubusercontent.com"]:
    try:
        s = socket.create_connection((host, 443), timeout=8)
        s.close()
        line = f"{host}: OK"
    except Exception as e:
        line = f"{host}: FAIL {e}"
    sys_out.write(line + "\n")
sys_out.close()
print("done")