# -*- coding: utf-8 -*-
"""本地 HTTP CONNECT 代理:把 github.com 流量转发到可用 IP 140.82.112.3
用法: 后台启动后 git -c http.proxy=http://127.0.0.1:18889 push
"""
import os
import socket
import sys
import threading
import time

TARGET_IP = "140.82.112.3"
LISTEN = ("127.0.0.1", 18889)
HARD_EXIT_SEC = 900  # 15 分钟后自动退出


def log(msg):
    sys.stderr.write("[%s] %s\n" % (time.strftime("%H:%M:%S"), msg))
    sys.stderr.flush()


def fwd(src, dst):
    try:
        while True:
            d = src.recv(65536)
            if not d:
                break
            dst.sendall(d)
    except Exception:
        pass
    try:
        dst.shutdown(socket.SHUT_WR)
    except Exception:
        pass


def pipe(a, b):
    t1 = threading.Thread(target=fwd, args=(a, b), daemon=True)
    t2 = threading.Thread(target=fwd, args=(b, a), daemon=True)
    t1.start()
    t2.start()
    t1.join()
    t2.join()
    a.close()
    b.close()


def handle(client):
    try:
        client.settimeout(30)
        req = b""
        while b"\r\n\r\n" not in req:
            d = client.recv(4096)
            if not d:
                client.close()
                return
            req += d
        line = req.split(b"\r\n", 1)[0].decode("latin1")
        parts = line.split()
        if len(parts) < 2 or parts[0].upper() != "CONNECT":
            client.sendall(b"HTTP/1.1 405 Method Not Allowed\r\n\r\n")
            client.close()
            return
        host, port = parts[1].rsplit(":", 1)
        port = int(port)
        if host == "github.com":
            # DNS 污染修复:强制走可用 IP
            addr = (TARGET_IP, 443)
            log("CONNECT %s -> %s" % (parts[1], addr))
        else:
            addr = (host, port)
            log("CONNECT %s -> direct" % parts[1])
        upstream = socket.create_connection(addr, timeout=15)
        upstream.settimeout(None)
        client.settimeout(None)
        client.sendall(b"HTTP/1.1 200 Connection Established\r\n\r\n")
        pipe(client, upstream)
    except Exception as e:
        log("handle err: %r" % e)
        try:
            client.close()
        except Exception:
            pass


def main():
    threading.Timer(HARD_EXIT_SEC, lambda: os._exit(0)).start()
    srv = socket.socket()
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(LISTEN)
    srv.listen(64)
    log("proxy listening %s:%s, github.com -> %s:443" % (LISTEN + (TARGET_IP,)))
    while True:
        c, _ = srv.accept()
        threading.Thread(target=handle, args=(c,), daemon=True).start()


if __name__ == "__main__":
    main()