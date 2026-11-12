import json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(r"c:\Users\bantu\Desktop\Briyani")

ASSET_MAP = {
    # Hero 5
    "copper-handi": "briyani/Hammered Copper Biryani Handi Pot.png",
    "biryani-rice-mound": "briyani/Floating Basmati Biryani Rice Mound.png",
    "chicken-drumstick": "briyani/Spicy Masala Chicken Drumstick.png",
    "fried-onions": "briyani/Crispy Floating Fried Onions.png",
    "mint-leaves": "briyani/Dewy Mint Leaves in Motion.png",
    # Ingredients 17
    "star-anise": "heroSection/Cinematic Floating Star Anise.png",
    "cinnamon-sticks": "heroSection/Cinnamon Sticks in Dramatic Light.png",
    "fried-onion-spirals": "heroSection/Crispy Fried Onion Spirals in Flight.png",
    "crispy-chicken-drumstick": "heroSection/Crispy Spiced Chicken Drumstick.png",
    "cilantro-sprig": "heroSection/Dewy Cilantro Sprig on Black.png",
    "tomato-slices": "heroSection/Dramatic Floating Tomato Slices.png",
    "basmati-rice-cluster": "heroSection/Floating Basmati Rice Grain Cluster.png",
    "bay-leaves": "heroSection/Floating Bay Leaves with Golden Veins.png",
    "cardamom-pods": "heroSection/Floating Cardamom Pods and Seeds.png",
    "cloves": "heroSection/Floating Cloves in Golden Light.png",
    "red-onion-rings": "heroSection/Floating Red Onion Rings in Motion.png",
    "mint-sprig": "heroSection/Glistening Fresh Mint Sprig.png",
    "chili-duo": "heroSection/Glossy Floating Chili Duo.png",
    "green-chili": "heroSection/Glossy Green Chili Pepper with Droplets.png",
    "lemon-wedge": "heroSection/Hyper-Realistic Floating Lemon Wedge.png",
    "steaming-biryani-handi": "heroSection/Steaming Chicken Biryani in Copper Handi.png",
    "saffron-threads": "heroSection/Vivid Saffron Threads on Dark Background.png",
}


def sample_palette(img_path: Path):
    im = Image.open(img_path).convert("RGBA")
    im.thumbnail((256, 256))
    arr = np.asarray(im, dtype=np.float32)
    rgb = arr[..., :3]
    alpha = arr[..., 3]
    lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]

    # Sample foreground: ignore pure near-black (<16) OR near-white (>244) studio backgrounds
    corners = np.concatenate([
        rgb[:8, :8].reshape(-1, 3),
        rgb[:8, -8:].reshape(-1, 3),
        rgb[-8:, :8].reshape(-1, 3),
        rgb[-8:, -8:].reshape(-1, 3),
    ], axis=0)
    bg_lum = float(np.median(0.299 * corners[:, 0] + 0.587 * corners[:, 1] + 0.114 * corners[:, 2]))

    if bg_lum > 200:
        mask = (alpha > 128) & (lum < 238)
    else:
        mask = (alpha > 128) & (lum > 18)

    pts = rgb[mask]
    if len(pts) < 50:
        pts = rgb.reshape(-1, 3)

    # Sort by luminance percentiles + saturation peaks
    p_lum = 0.299 * pts[:, 0] + 0.587 * pts[:, 1] + 0.114 * pts[:, 2]
    sat = (pts.max(axis=1) - pts.min(axis=1)) / (pts.max(axis=1) + 1e-5)

    order = np.argsort(p_lum)
    n = len(pts)
    dark = pts[order[int(n * 0.12)]].astype(int).tolist()
    mid = pts[order[int(n * 0.50)]].astype(int).tolist()
    bright = pts[order[int(n * 0.85)]].astype(int).tolist()
    hi = pts[order[int(n * 0.96)]].astype(int).tolist()
    vib_idx = np.argsort(sat * 0.7 + (p_lum / 255.0) * 0.3)[-min(200, n):]
    vibrant = np.median(pts[vib_idx], axis=0).astype(int).tolist()

    def to_hex(c):
        return f"#{c[0]:02x}{c[1]:02x}{c[2]:02x}"

    return {
        "bgType": "white" if bg_lum > 200 else "black",
        "dark": {"rgb": dark, "hex": to_hex(dark)},
        "mid": {"rgb": mid, "hex": to_hex(mid)},
        "vibrant": {"rgb": vibrant, "hex": to_hex(vibrant)},
        "bright": {"rgb": bright, "hex": to_hex(bright)},
        "highlight": {"rgb": hi, "hex": to_hex(hi)},
    }


def main():
    out = {}
    for slug, rel in ASSET_MAP.items():
        p = ROOT / rel
        if not p.exists():
            raise FileNotFoundError(f"Missing reference: {p}")
        out[slug] = {
            "reference": rel,
            **sample_palette(p),
        }
        print(f"{slug:26s} | dark={out[slug]['dark']['hex']} mid={out[slug]['mid']['hex']} vib={out[slug]['vibrant']['hex']} bright={out[slug]['bright']['hex']}")
    dst = ROOT / "tools" / "photoreal-rebuild" / "color-palettes.json"
    dst.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(f"\nSaved palettes to {dst}")


if __name__ == "__main__":
    main()
