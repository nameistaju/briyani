import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


def make_sheet(meta_json_path: str):
    meta = json.loads(Path(meta_json_path).read_text(encoding="utf-8"))
    ref_path = Path(meta["reference"])
    views = meta["views"]  # dict with teal_0..3, maroon_0..3 paths
    out_sheet = Path(meta["sheetPath"])
    out_sheet.parent.mkdir(parents=True, exist_ok=True)

    # 1920 x 960 canvas
    W, H = 1920, 960
    canvas = Image.new("RGB", (W, H), (14, 10, 10))
    draw = ImageDraw.Draw(canvas)

    try:
        font_lg = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 26)
        font_md = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 19)
        font_sm = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 16)
    except Exception:
        font_lg = ImageFont.load_default()
        font_md = font_lg
        font_sm = font_lg

    # Left column (0..640): Reference Photo + Exact Stats
    ref_im = Image.open(ref_path).convert("RGB")
    ref_box_w, ref_box_h = 600, 600
    ref_im.thumbnail((ref_box_w, ref_box_h), Image.Resampling.LANCZOS)
    rx = 20 + (ref_box_w - ref_im.width) // 2
    ry = 64 + (ref_box_h - ref_im.height) // 2
    canvas.paste(ref_im, (rx, ry))

    draw.text((20, 18), f"ASSET: {meta['slug']} ({meta['category'].upper()})", fill=(247, 232, 200), font=font_lg)
    draw.text((20, 46), f"REF: {meta['reference']}", fill=(190, 190, 190), font=font_sm)

    y_stat = 690
    stats_lines = [
        f"Triangles : {meta['triangles']:,} tris (pre-opt: {meta.get('rawTriangles', meta['triangles']):,})",
        f"Vertices  : {meta['vertices']:,}",
        f"GLB Raw   : {meta['rawBytes']/1024:.1f} KB",
        f"GLB Opt   : {meta['optBytes']/1024:.1f} KB  (Budget <= {meta['budgetKB']} KB -> {'PASS' if meta['optBytes']/1024 <= meta['budgetKB'] else 'OVER'})",
        f"Bounds    : {meta['size'][0]:.3f} x {meta['size'][1]:.3f} x {meta['size'][2]:.3f} m",
        f"Materials : {', '.join(meta['materials'][:3])}",
        f"Maps      : {', '.join(meta['channels'])}",
    ]
    for line in stats_lines:
        col = (140, 240, 180) if "-> PASS" in line else ((255, 110, 110) if "-> OVER" in line else (228, 222, 210))
        draw.text((20, y_stat), line, fill=col, font=font_sm)
        y_stat += 28

    labels = ["FRONT", "3/4 HERO", "SIDE", "TOP"]

    # Middle column (640..1280): Teal #117a7a 2x2
    draw.rectangle([640, 0, 1279, H], fill=(17, 122, 122))
    draw.text((660, 14), "TEAL (#117a7a) - OPTIMIZED GLB", fill=(255, 255, 255), font=font_md)
    for i, vp in enumerate(views["teal"]):
        col_i = i % 2
        row_i = i // 2
        vx = 648 + col_i * 314
        vy = 56 + row_i * 448
        vim = Image.open(vp).convert("RGB").resize((306, 434), Image.Resampling.LANCZOS)
        canvas.paste(vim, (vx, vy))
        draw.text((vx + 8, vy + 8), labels[i], fill=(245, 240, 210), font=font_sm)

    # Right column (1280..1920): Maroon #650d1a 2x2
    draw.rectangle([1280, 0, 1919, H], fill=(101, 13, 26))
    draw.text((1300, 14), "MAROON (#650d1a) - OPTIMIZED GLB", fill=(255, 255, 255), font=font_md)
    for i, vp in enumerate(views["maroon"]):
        col_i = i % 2
        row_i = i // 2
        vx = 1288 + col_i * 314
        vy = 56 + row_i * 448
        vim = Image.open(vp).convert("RGB").resize((306, 434), Image.Resampling.LANCZOS)
        canvas.paste(vim, (vx, vy))
        draw.text((vx + 8, vy + 8), labels[i], fill=(245, 240, 210), font=font_sm)

    # Vertical dividers
    draw.line([(640, 0), (640, H)], fill=(50, 50, 50), width=3)
    draw.line([(1280, 0), (1280, H)], fill=(50, 50, 50), width=3)

    canvas.save(out_sheet, format="PNG")
    print(f"QA sheet saved: {out_sheet}")


if __name__ == "__main__":
    make_sheet(sys.argv[1])
