import shutil
import time
from pathlib import Path
from gradio_client import Client, handle_file

IMG = Path(r"c:\Users\bantu\Desktop\Briyani\briyani\Spicy Masala Chicken Drumstick.png")
OUT_DIR = Path(r"c:\Users\bantu\Desktop\Briyani\tools\tmp_test_3d")
OUT_DIR.mkdir(parents=True, exist_ok=True)


def test_hunyuan_all():
    print("\n=== Testing tencent/Hunyuan3D-2 /generation_all ===", flush=True)
    t0 = time.time()
    try:
        client = Client("tencent/Hunyuan3D-2", httpx_kwargs={"timeout": 120.0})
        res = client.predict(
            caption="",
            image=handle_file(str(IMG)),
            mv_image_front=None,
            mv_image_back=None,
            mv_image_left=None,
            mv_image_right=None,
            steps=30,
            guidance_scale=5.5,
            seed=1234,
            octree_resolution=256,
            check_box_rembg=True,
            num_chunks=8000,
            randomize_seed=False,
            api_name="/generation_all",
        )
        print(f"Hunyuan3D-2 /generation_all done in {time.time()-t0:.1f}s", flush=True)
        print("Result tuple[0..1], stats:", res[0], res[1], res[3], flush=True)
        for idx, tag in [(0, "white"), (1, "textured")]:
            v = res[idx]
            p = v.get("value") if isinstance(v, dict) else v
            if p and Path(p).exists():
                dst = OUT_DIR / f"drumstick_hunyuan_{tag}.glb"
                shutil.copy2(p, dst)
                print(f"Saved {dst} ({dst.stat().st_size} bytes)", flush=True)
        return True
    except Exception as e:
        print(f"Hunyuan3D-2 failed in {time.time()-t0:.1f}s: {type(e).__name__}: {e}", flush=True)
        return False


def test_trellis2():
    print("\n=== Testing microsoft/TRELLIS.2 ===", flush=True)
    t0 = time.time()
    try:
        client = Client("microsoft/TRELLIS.2", httpx_kwargs={"timeout": 120.0})
        client.predict(api_name="/start_session")
        prep = client.predict(input=handle_file(str(IMG)), api_name="/preprocess_image")
        print("TRELLIS.2 prep:", prep, flush=True)
        client.predict(
            image=prep,
            seed=1234,
            resolution="1024",
            ss_guidance_strength=7.5,
            ss_guidance_rescale=0.7,
            ss_sampling_steps=12,
            ss_rescale_t=5.0,
            shape_slat_guidance_strength=7.5,
            shape_slat_guidance_rescale=0.5,
            shape_slat_sampling_steps=12,
            shape_slat_rescale_t=3.0,
            tex_slat_guidance_strength=1.0,
            tex_slat_guidance_rescale=0.0,
            tex_slat_sampling_steps=12,
            tex_slat_rescale_t=3.0,
            api_name="/image_to_3d",
        )
        print(f"TRELLIS.2 image_to_3d done in {time.time()-t0:.1f}s", flush=True)
        glb = client.predict(
            decimation_target=80000,
            texture_size=2048,
            api_name="/extract_glb",
        )
        print("TRELLIS.2 extract_glb:", glb, flush=True)
        p = glb[0] if isinstance(glb, (list, tuple)) else glb
        if isinstance(p, dict):
            p = p.get("value") or p.get("path")
        if p and Path(p).exists():
            dst = OUT_DIR / "drumstick_trellis2.glb"
            shutil.copy2(p, dst)
            print(f"Saved {dst} ({dst.stat().st_size} bytes)", flush=True)
        return True
    except Exception as e:
        print(f"TRELLIS.2 failed in {time.time()-t0:.1f}s: {type(e).__name__}: {e}", flush=True)
        return False


if __name__ == "__main__":
    ok_t = test_trellis2()
    ok_h = test_hunyuan_all()
    print(f"\nSUMMARY: trellis2={ok_t}, hunyuan_all={ok_h}", flush=True)
