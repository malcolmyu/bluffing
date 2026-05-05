"""
cut_sprites.py — 精灵表裁切工具
直接按检测到的帧边界裁切，居中到 400x300，再去白底转透明。
不额外裁剪内容边缘，保证元素完整。
"""
from PIL import Image
import os, sys

def find_content_rows(img_rgb, bg=(248,248,248), tol=40):
    w, h = img_rgb.size
    pix = img_rgb.load()
    rows = []
    y = 0
    while y < h:
        while y < h and sum(1 for x in range(0,w,4) if not (abs(pix[x,y][0]-bg[0])<=tol and abs(pix[x,y][1]-bg[1])<=tol and abs(pix[x,y][2]-bg[2])<=tol)) <= 2:
            y += 1
        if y >= h: break
        y0 = y
        while y < h and sum(1 for x in range(0,w,4) if not (abs(pix[x,y][0]-bg[0])<=tol and abs(pix[x,y][1]-bg[1])<=tol and abs(pix[x,y][2]-bg[2])<=tol)) > 2:
            y += 1
        y1 = y - 1
        if y1 - y0 >= 60: rows.append((y0, y1))
    return rows

def expand_frame_horizontal(img_rgb, x0, y0, x1, y1, bg=(248, 248, 248), tol=40):
    """
    粗定位后按「整列是否含非背景像素」向左右扩展，避免抽样列把细窄的左侧/右侧当成间隙切掉。
    """
    w, _ = img_rgb.size
    pix = img_rgb.load()

    def is_bg(px):
        return abs(px[0] - bg[0]) <= tol and abs(px[1] - bg[1]) <= tol and abs(px[2] - bg[2]) <= tol

    def column_has_any_content(cx):
        if cx < 0 or cx >= w:
            return False
        for y in range(y0, y1 + 1):
            if not is_bg(pix[cx, y]):
                return True
        return False

    while x0 > 0 and column_has_any_content(x0 - 1):
        x0 -= 1
    while x1 + 1 < w and column_has_any_content(x1 + 1):
        x1 += 1
    return x0, x1


def find_frames_in_row(img_rgb, y0, y1, bg=(248,248,248), tol=40):
    w, _ = img_rgb.size
    pix = img_rgb.load()
    skip = max(1, (y1-y0+1)//10)
    # 用「非背景样本比例」区分间隙与内容：原先 <=1 会把左侧只命中 1～2 个抽样行的列当成空白，导致左侧被吃进画面内。
    samples = list(range(y0, y1 + 1, skip))
    if not samples:
        samples = [y0]
    n_samp = len(samples)
    gap_max_non_bg = max(2, (n_samp * 5 + 99) // 100)  # 约 5% 非背景仍视为间隙噪声，至少允许 2 个样本点

    frames = []
    x = 0

    def is_bg(px):
        return abs(px[0]-bg[0])<=tol and abs(px[1]-bg[1])<=tol and abs(px[2]-bg[2])<=tol

    def col_non_bg_sampled(cx):
        return sum(1 for y in samples if not is_bg(pix[cx, y]))

    while x < w:
        while x < w and col_non_bg_sampled(x) <= gap_max_non_bg:
            x += 1
        if x >= w: break
        x0 = x
        while x < w and col_non_bg_sampled(x) > gap_max_non_bg:
            x += 1
        x1 = x - 1
        if x1 - x0 >= 16:
            x0, x1 = expand_frame_horizontal(img_rgb, x0, y0, x1, y1, bg, tol)
            frames.append((x0, x1))
    return frames

def make_transparent(img, bg=(248,248,248), tol=40):
    img = img.convert('RGBA')
    pix = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            if abs(r-bg[0])<=tol and abs(g-bg[1])<=tol and abs(b-bg[2])<=tol:
                pix[x, y] = (r, g, b, 0)
    return img

def cut(path, out_dir):
    name = os.path.splitext(os.path.basename(path))[0]
    out = os.path.join(out_dir, name)
    os.makedirs(out, exist_ok=True)
    
    # copy script
    script_dst = os.path.join(out_dir, 'cut_sprites.py')
    src = os.path.abspath(__file__) if '__file__' in dir() else sys.argv[0]
    if os.path.exists(src) and src != script_dst:
        import shutil
        shutil.copy2(src, script_dst)
        print(f"  📄 脚本已复制到: {script_dst}")
    
    img = Image.open(path).convert('RGBA')
    img_rgb = img.convert('RGB')
    w, h = img.size
    print(f"\n📐 {name} — {w}x{h}")
    
    # 1. 找行和帧
    rows = find_content_rows(img_rgb)
    raw = []
    for ri, (y0, y1) in enumerate(rows):
        cols = find_frames_in_row(img_rgb, y0, y1)
        print(f"    Row {ri} (y={y0}-{y1}): {len(cols)} frames")
        for x0, x1 in cols:
            raw.append((ri, x0, y0, x1, y1, (x1-x0+1)*(y1-y0+1)))
    
    # 2. 取面积最大的 5 帧；同一边界框只保留一条（避免多行/扩展后重复计入）
    raw.sort(key=lambda f: -f[5])
    top5 = []
    seen_bbox = set()
    for f in raw:
        _ri, x0, y0, x1, y1, _area = f
        key = (x0, y0, x1, y1)
        if key in seen_bbox:
            continue
        seen_bbox.add(key)
        top5.append(f)
        if len(top5) >= 5:
            break
    top5.sort(key=lambda f: (f[0], f[1]))
    
    print(f"\n  Top 5 by area:")
    
    STD_W, STD_H = 400, 300
    
    for idx, (ri, x0, y0, x1, y1, area) in enumerate(top5):
        fw, fh = x1-x0+1, y1-y0+1
        
        # 直接粗裁帧区域（不裁剪内容边缘）
        frame = img.crop((x0, y0, x1+1, y1+1))
        
        # 居中放到 400x300 画布
        canvas = Image.new('RGBA', (STD_W, STD_H), (248, 248, 248, 0))
        px_off = (STD_W - fw) // 2
        py_off = (STD_H - fh) // 2
        canvas.paste(frame, (px_off, py_off))
        
        # 最后去白底
        canvas = make_transparent(canvas)
        
        fn = f"{name}_{idx+1:02d}.png"
        canvas.save(os.path.join(out, fn))
        print(f"    [{idx+1:02d}] frame=({x0},{y0},{x1+1},{y1+1}) {fw}x{fh} → {STD_W}x{STD_H} centered")
    
    print(f"\n  ✅ {len(top5)} frames → {out}/")

if __name__ == '__main__':
    args = sys.argv[1:]
    path = args[0] if args else None
    out_dir = args[1] if len(args) > 1 else (os.path.dirname(path) if path else '.')
    if not path:
        print("Usage: python3 cut_sprites.py <image.png> [output_dir]")
        sys.exit(1)
    cut(path, out_dir)
