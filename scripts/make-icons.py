#!/usr/bin/env python3
"""Draws Kanta's icons (the PDF's white play triangle on the purple gradient) with no dependencies."""
import struct, sys, zlib, os

P = (0xA8, 0x55, 0xF7)  # primary
A = (0x68, 0x26, 0xF5)  # accent
BG = (0x08, 0x09, 0x0E)

def png(path, w, h, px):
    raw = b''.join(b'\x00' + bytes(px[y * w * 4:(y + 1) * w * 4]) for y in range(h))
    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    open(path, 'wb').write(data)

def tri_cover(x, y, cx, cy, r):
    # Play triangle pointing right, centred (slightly right for optical balance); 4x4 supersampling.
    ax, ay = cx - r * 0.42, cy - r * 0.5
    bx, by = cx - r * 0.42, cy + r * 0.5
    tx, ty = cx + r * 0.5, cy
    def inside(px, py):
        def s(x1, y1, x2, y2):
            return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2)
        d1, d2, d3 = s(ax, ay, bx, by), s(bx, by, tx, ty), s(tx, ty, ax, ay)
        neg = d1 < 0 or d2 < 0 or d3 < 0
        pos = d1 > 0 or d2 > 0 or d3 > 0
        return not (neg and pos)
    n = 0
    for i in range(4):
        for j in range(4):
            n += inside(x + (i + 0.5) / 4, y + (j + 0.5) / 4)
    return n / 16

def draw(size, gradient=True, transparent=False, scale=1.0):
    px = bytearray(size * size * 4)
    cx = cy = size / 2
    r = size * 0.36 * scale
    for y in range(size):
        for x in range(size):
            if transparent:
                base = (0, 0, 0, 0)
            elif gradient:
                t = (x + y) / (2 * size)
                base = tuple(int(P[k] + (A[k] - P[k]) * t) for k in range(3)) + (255,)
            else:
                base = BG + (255,)
            c = 0.0
            if abs(x - cx) < r and abs(y - cy) < r:
                c = tri_cover(x, y, cx, cy, r)
            if transparent:
                out = (255, 255, 255, int(255 * c))
            else:
                out = tuple(int(base[k] * (1 - c) + 255 * c) for k in range(3)) + (255,)
            i = (y * size + x) * 4
            px[i:i + 4] = bytes(out)
    return px

out = sys.argv[1] if len(sys.argv) > 1 else 'assets'
os.makedirs(out, exist_ok=True)
png(f'{out}/icon.png', 512, 512, draw(512))
png(f'{out}/adaptive-icon.png', 512, 512, draw(512, transparent=True, scale=0.62))
png(f'{out}/splash.png', 384, 384, draw(384, transparent=True))
png(f'{out}/favicon.png', 48, 48, draw(48))
print('icons written to', out)
