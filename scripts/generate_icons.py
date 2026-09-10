import os, struct, zlib, math

def make_png(width, height, get_pixel, filename):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type none
        for x in range(width):
            r, g, b, a = get_pixel(x, y, width, height)
            raw_data.extend([r, g, b, a])
    
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    png = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png += chunk(b'IHDR', ihdr)
    compressed = zlib.compress(bytes(raw_data), 9)
    png += chunk(b'IDAT', compressed)
    png += chunk(b'IEND', b'')

    os.makedirs(os.path.dirname(os.path.abspath(filename)), exist_ok=True)
    with open(filename, 'wb') as f:
        f.write(png)
    print(f'Wrote {filename} ({len(png)} bytes)')

def create_icons():
    # 1. Any icon (with squircle background or full rounded rect)
    def pixel_any(x, y, w, h):
        # normalize to 0..1
        nx = x / (w - 1)
        ny = y / (h - 1)
        
        # Corner radius = 22% of dimension
        cx = 0.5
        cy = 0.5
        dx = abs(nx - 0.5)
        dy = abs(ny - 0.5)
        
        # Rounded rect mask
        # box dimensions 0.92 x 0.92
        half_w = 0.46
        half_h = 0.46
        radius = 0.18
        
        qx = dx - (half_w - radius)
        qy = dy - (half_h - radius)
        dist = 0.0
        if qx > 0 and qy > 0:
            dist = math.sqrt(qx*qx + qy*qy) - radius
        elif qx > 0:
            dist = qx - radius
        elif qy > 0:
            dist = qy - radius
        else:
            dist = max(qx - radius, qy - radius)
        
        # Anti-aliased alpha for rounded rect
        pixel_size = 1.0 / w
        alpha = max(0.0, min(1.0, 0.5 - dist / pixel_size))
        if alpha <= 0.001:
            return 0, 0, 0, 0

        # Emerald gradient (#065f46 to #059669 to #10b981)
        grad_t = (nx + ny) * 0.5
        r_bg = int(5 + grad_t * 11)
        g_bg = int(110 + grad_t * 60)
        b_bg = int(80 + grad_t * 45)

        # Foreground glyph: Wallet / Card with Growth Chart (centered at 0.5, 0.5)
        # Scaled coordinate in glyph space (-1 to 1)
        gx = (nx - 0.5) / 0.28
        gy = (ny - 0.5) / 0.28

        is_fg = False
        fg_r, fg_g, fg_b = 255, 255, 255

        # Wallet body: rx in [-0.85, 0.85], ry in [-0.55, 0.55]
        # Rounded box:
        bw, bh, br = 0.82, 0.55, 0.18
        bx = abs(gx) - (bw - br)
        by = abs(gy) - (bh - br)
        bdist = 0.0
        if bx > 0 and by > 0:
            bdist = math.sqrt(bx*bx + by*by) - br
        elif bx > 0:
            bdist = bx - br
        elif by > 0:
            bdist = by - br
        else:
            bdist = max(bx - br, by - br)

        if bdist <= 0:
            is_fg = True

        # Wallet flap / clasp on right: center (0.45, 0), rx 0.35, ry 0.22
        cw = abs(gx - 0.45) - 0.18
        ch = abs(gy) - 0.18
        if cw <= 0 and ch <= 0:
            is_fg = True
            # Clasp gold dot center (0.48, 0)
            if math.hypot(gx - 0.48, gy) < 0.09:
                fg_r, fg_g, fg_b = 250, 204, 21  # amber-400

        # Card top sticking out: gx in [-0.65, 0.2], gy in [-0.85, -0.45]
        if -0.65 <= gx <= 0.25 and -0.80 <= gy <= -0.45:
            is_fg = True
            fg_r, fg_g, fg_b = 240, 253, 244  # soft emerald white

        # Upward arrow badge in upper right (center 0.45, -0.45)
        adist = math.hypot(gx - 0.45, gy - (-0.45))
        if adist < 0.36:
            # Badge background amber
            fg_r, fg_g, fg_b = 245, 158, 11
            is_fg = True
            # Arrow icon inside badge (white)
            agx = gx - 0.45
            agy = gy - (-0.45)
            # Up-right arrow line
            if abs(agx + agy) < 0.06 and -0.18 <= agx <= 0.18 and -0.18 <= agy <= 0.18:
                fg_r, fg_g, fg_b = 255, 255, 255
            # Arrow head:
            if (agx > 0.06 and abs(agy - (-0.15)) < 0.05) or (agy < -0.06 and abs(agx - 0.15) < 0.05):
                fg_r, fg_g, fg_b = 255, 255, 255

        if is_fg:
            return fg_r, fg_g, fg_b, int(alpha * 255)
        else:
            return r_bg, g_bg, b_bg, int(alpha * 255)

    # 2. Maskable icon: full-bleed background without outer border-radius clipping,
    # safe area keeps glyph inside center 70% (0.15 to 0.85).
    def pixel_maskable(x, y, w, h):
        nx = x / (w - 1)
        ny = y / (h - 1)

        grad_t = (nx + ny) * 0.5
        r_bg = int(5 + grad_t * 11)
        g_bg = int(110 + grad_t * 60)
        b_bg = int(80 + grad_t * 45)

        # Scaled coordinate in glyph space (-1 to 1) with safe margin (radius 0.23 instead of 0.28)
        gx = (nx - 0.5) / 0.22
        gy = (ny - 0.5) / 0.22

        is_fg = False
        fg_r, fg_g, fg_b = 255, 255, 255

        bw, bh, br = 0.82, 0.55, 0.18
        bx = abs(gx) - (bw - br)
        by = abs(gy) - (bh - br)
        bdist = 0.0
        if bx > 0 and by > 0:
            bdist = math.sqrt(bx*bx + by*by) - br
        elif bx > 0:
            bdist = bx - br
        elif by > 0:
            bdist = by - br
        else:
            bdist = max(bx - br, by - br)

        if bdist <= 0:
            is_fg = True

        cw = abs(gx - 0.45) - 0.18
        ch = abs(gy) - 0.18
        if cw <= 0 and ch <= 0:
            is_fg = True
            if math.hypot(gx - 0.48, gy) < 0.09:
                fg_r, fg_g, fg_b = 250, 204, 21

        if -0.65 <= gx <= 0.25 and -0.80 <= gy <= -0.45:
            is_fg = True
            fg_r, fg_g, fg_b = 240, 253, 244

        adist = math.hypot(gx - 0.45, gy - (-0.45))
        if adist < 0.36:
            fg_r, fg_g, fg_b = 245, 158, 11
            is_fg = True
            agx = gx - 0.45
            agy = gy - (-0.45)
            if abs(agx + agy) < 0.06 and -0.18 <= agx <= 0.18 and -0.18 <= agy <= 0.18:
                fg_r, fg_g, fg_b = 255, 255, 255
            if (agx > 0.06 and abs(agy - (-0.15)) < 0.05) or (agy < -0.06 and abs(agx - 0.15) < 0.05):
                fg_r, fg_g, fg_b = 255, 255, 255

        if is_fg:
            return fg_r, fg_g, fg_b, 255
        else:
            return r_bg, g_bg, b_bg, 255

    make_png(192, 192, pixel_any, 'public/pwa-192x192.png')
    make_png(512, 512, pixel_any, 'public/pwa-512x512.png')
    make_png(512, 512, pixel_maskable, 'public/pwa-maskable-512x512.png')
    make_png(180, 180, pixel_any, 'public/apple-touch-icon.png')
    make_png(64, 64, pixel_any, 'public/favicon.ico')

create_icons()
