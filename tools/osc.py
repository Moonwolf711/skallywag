"""Tiny AbletonOSC client helper. Agents use:

  python tools/osc.py <addr> [args...]

Args are auto-typed (int / float / string). Prints reply as JSON-ish.
Receive port 11001 is bound explicitly — AbletonOSC always replies there.
"""
import json
import socket
import struct
import sys
import time

LISTEN = ('127.0.0.1', 11001)
SEND   = ('127.0.0.1', 11000)
TIMEOUT = 3.0


def osc_str(s: str) -> bytes:
    b = s.encode() + b'\0'
    return b + b'\0' * (-len(b) % 4)


def encode_arg(a):
    try:
        i = int(a)
        if str(i) == a or a.startswith('-') and a[1:].isdigit():
            return 'i', struct.pack('>i', i), None
    except (ValueError, TypeError):
        pass
    try:
        f = float(a)
        return 'f', struct.pack('>f', f), None
    except (ValueError, TypeError):
        pass
    return 's', osc_str(str(a)), None


def build_message(addr: str, args) -> bytes:
    out = osc_str(addr)
    tags = ','
    payload = b''
    for a in args:
        t, p, _ = encode_arg(a)
        tags += t
        payload += p
    return out + osc_str(tags) + payload


def parse_reply(data: bytes):
    """Decode a single OSC message — addr + tag-typed args."""
    end = data.index(b'\0')
    addr = data[:end].decode()
    next_aligned = (end // 4 + 1) * 4
    rest = data[next_aligned:]
    if not rest.startswith(b','):
        return {"address": addr, "args": []}
    tag_end = rest.index(b'\0')
    tags = rest[1:tag_end].decode()
    p_start = (tag_end // 4 + 1) * 4
    p = rest[p_start:]
    args = []
    for t in tags:
        if t == 'i':
            args.append(struct.unpack('>i', p[:4])[0]); p = p[4:]
        elif t == 'f':
            args.append(struct.unpack('>f', p[:4])[0]); p = p[4:]
        elif t == 's':
            e = p.index(b'\0')
            args.append(p[:e].decode())
            p = p[(e // 4 + 1) * 4:]
        elif t == 'b':
            length = struct.unpack('>i', p[:4])[0]
            args.append(p[4:4+length].hex())
            p = p[(4 + length + 3) & ~3:]
    return {"address": addr, "args": args}


def main():
    if len(sys.argv) < 2:
        print('usage: osc.py <addr> [args...]', file=sys.stderr)
        sys.exit(2)
    addr = sys.argv[1]
    # Git Bash mangles a leading slash into "C:/Program Files/Git/...".
    # Detect and recover the OSC address regardless.
    if "Git" in addr and "/live" in addr:
        addr = "/" + addr.split("/live", 1)[1]
        addr = "/live" + addr[1:] if not addr.startswith("/live") else addr
    if not addr.startswith("/"):
        addr = "/" + addr
    args = sys.argv[2:]
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.bind(LISTEN)
    except OSError as e:
        print(json.dumps({"error": f"bind {LISTEN}: {e}"}))
        sys.exit(1)
    sock.settimeout(TIMEOUT)
    sock.sendto(build_message(addr, args), SEND)
    deadline = time.time() + TIMEOUT
    replies = []
    while time.time() < deadline:
        try:
            data, _ = sock.recvfrom(65536)
            replies.append(parse_reply(data))
            # short follow-up window for multi-message responses
            sock.settimeout(0.15)
        except socket.timeout:
            break
    if not replies:
        print(json.dumps({"error": "timeout", "sent": addr}))
        sys.exit(1)
    print(json.dumps(replies if len(replies) > 1 else replies[0], indent=2))


if __name__ == "__main__":
    main()
