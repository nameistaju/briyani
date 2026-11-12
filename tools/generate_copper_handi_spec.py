#!/usr/bin/env python3
"""Author a strict-quality ObjectSculptSpec for the Hammered Copper Biryani Handi."""
import json
from pathlib import Path

starter = json.loads(Path("tools/_test_handi/starter-spec.json").read_text(encoding="utf-8"))

starter["suitability"] = "pass"
starter["scores"] = {
    "object_isolation": 3,
    "silhouette_readability": 3,
    "depth_inference": 3,
    "primitive_decomposition": 3,
    "material_procedurality": 3,
    "occlusion_risk": 1,
    "interaction_fit": 3,
}

starter["coordinateFrame"] = {
    "front": "+Z",
    "up": "+Y",
    "scaleReference": "1 world unit = 1 meter (handi outer diameter 0.28m, height 0.16m, bottom resting at y=0)",
}

starter["silhouette"] = {
    "boundingShape": "squat rotund vessel with constricted neck and flared rolled rim",
    "aspectRatios": ["diameter:height = 1.75:1", "rimDiameter:bellyDiameter = 0.98:1", "neckDiameter:bellyDiameter = 0.78:1"],
    "symmetry": "radial",
    "dominantCurves": ["convex bulbous lower belly", "concave neck throat", "flared collar lip", "rolled torus rim bead"],
    "negativeSpaces": ["open circular top mouth leading into hollow interior cavity"],
    "landmarks": ["base foot curve y=0.00", "max belly bulge y=0.068 r=0.143", "neck waist y=0.128 r=0.112", "flared rim lip y=0.158 r=0.140"],
}

starter["preSpecAssessment"]["objectClass"] = {
    "primaryType": "hammered copper biryani handi pot",
    "primaryDomain": "object",
    "formLanguage": ["rotational-lathe", "organic-hammered-relief"],
    "structureKind": ["hollow-vessel", "rolled-rim-collar"],
    "motionPotential": ["translate", "rotate", "fill-interior-cavity"],
    "materialFamilies": ["hammered-copper", "brushed-brass-interior"],
    "notes": "Radial-symmetric traditional Indian dum biryani cooking vessel with hammered exterior copper body and warm golden-brass brushed interior.",
}

starter["preSpecAssessment"]["complexity"]["scores"] = {
    "silhouetteComplexity": 2,
    "componentCount": 2,
    "hierarchyDepth": 2,
    "repetitionDensity": 3,
    "materialLayerCount": 3,
    "localDetailDensity": 3,
    "occlusionRisk": 1,
    "actionReadinessNeed": 3,
}
starter["preSpecAssessment"]["complexity"]["estimatedCounts"] = {
    "macroComponents": 3,
    "mesoComponents": 8,
    "microFeatureGroups": 5,
    "materialLayers": 3,
    "repetitionSystems": 1,
}

starter["preSpecAssessment"]["detailInventory"]["details"] = [
    {"id": f"handi-detail-{i}", "kind": kind, "description": desc, "region": {"x": 0.2, "y": 0.2, "width": 0.6, "height": 0.6, "units": "normalized"}, "scale": "meso", "affects": "silhouette-and-shading", "mapsTo": {"type": mtype, "ref": mref}, "evidenceRef": "full-object", "confidence": 0.9}
    for i, (kind, desc, mtype, mref) in enumerate([
        ("contour", "Planished circular hammered copper facets across exterior belly", "component.localFeatures", "copper-belly-shell"),
        ("bevel", "Rolled outward brass-copper rim lip bead", "component.localFeatures", "rolled-rim-lip"),
        ("groove", "Concave neck collar crease below flared rim", "component.localFeatures", "flared-neck-collar"),
        ("gloss", "Specular brushed metal interior wall highlights", "material.localOverrides", "brass-interior"),
        ("stain", "Dark oxidized copper patina in hammered dimple valleys and lower heat-patina base", "material.localOverrides", "hammered-copper"),
        ("scratch", "Concentric radial lathe-polishing streaks inside bowl", "material.localOverrides", "brass-interior"),
        ("bevel", "Rounded foot transition at base bottom", "component.localFeatures", "vessel-base-foot"),
        ("seam", "Interior-to-rim transition fillet", "component.localFeatures", "interior-bowl-liner"),
        ("gloss", "Specular highlight band on top rolled rim edge", "material.localOverrides", "rim-brass"),
        ("stain", "Subtle soot/heat darkening toward bottom curvature", "material.localOverrides", "hammered-copper"),
    ], 1)
]

pbr_dir = "public/3d-assets/textures/copper-handi"
pbr_block = {
    "usable": True,
    "confidence": 0.86,
    "targetThreshold": 0.7,
    "sourceImage": "briyani/Hammered Copper Biryani Handi Pot.png",
    "palette": ["#502306", "#834217", "#C17137", "#050200", "#F4BF87"],
    "maps": {
        "albedo": {"path": f"{pbr_dir}/hammered-copper_albedo.png", "url": "hammered-copper_albedo.png", "channel": "albedo"},
        "roughness": {"path": f"{pbr_dir}/hammered-copper_roughness.png", "url": "hammered-copper_roughness.png", "channel": "roughness"},
        "height": {"path": f"{pbr_dir}/hammered-copper_height.png", "url": "hammered-copper_height.png", "channel": "height"},
        "normal": {"path": f"{pbr_dir}/hammered-copper_normal.png", "url": "hammered-copper_normal.png", "channel": "normal"},
        "ao": {"path": f"{pbr_dir}/hammered-copper_ao.png", "url": "hammered-copper_ao.png", "channel": "ao"},
    },
}

def make_mat(mid, name, base_color, sec, metal, rough, normal_str, local_overrides):
    return {
        "id": mid,
        "name": name,
        "type": "physical",
        "shaderModel": "MeshPhysicalMaterial",
        "baseColor": base_color,
        "color": base_color,
        "albedo": {"dominant": base_color, "secondary": sec, "samplingNotes": "Sampled from reference pixels."},
        "colorVariation": {"palette": [base_color] + sec, "pattern": "hammered-cell-patina", "amplitude": 0.18, "heightCorrelation": 0.6},
        "textureResolution": 1024,
        "textureProjection": {"mode": "uv", "repeat": [1.0, 1.0], "anisotropy": 8, "texelDensityIntent": "Seamless UV wrap"},
        "surfaceFrequencyBands": [
            {"id": "macro", "frequency": 2.0, "amplitude": 0.35, "role": "heat patina gradient from base to neck"},
            {"id": "meso", "frequency": 18.0, "amplitude": 0.45, "role": "hammered planishing dimples"},
            {"id": "micro", "frequency": 64.0, "amplitude": 0.12, "role": "fine metallic polish micro-grain"},
        ],
        "roughness": {"base": rough, "variation": 0.14, "map": "independent-procedural-field", "localResponse": "higher roughness in dimple creases"},
        "metalness": {"base": metal, "variation": 0.05},
        "normal": {"pattern": "derived-from-independent-height-field", "strength": normal_str, "scale": 16.0, "space": "tangent"},
        "bump": {"pattern": "hammered-dimples", "amplitude": 0.015, "scale": 16.0},
        "displacement": {"pattern": "hammered-facets", "amplitude": 0.0025, "scale": 16.0, "silhouetteAffects": True},
        "ambientOcclusion": {"cavityStrength": 0.35, "contactShadowBias": 0.3, "notes": "Darken dimple edges and neck crease"},
        "wear": {"edgeWear": 0.28, "scratches": ["fine radial buffing marks"], "chips": []},
        "dirt": {"amount": 0.18, "cavityBias": 0.7, "color": "#2b1204"},
        "localOverrides": local_overrides,
        "referencePbr": pbr_block,
        "shaderNotes": ["Independent procedural albedo, normal, and roughness CanvasTextures."],
        "notes": name,
    }

starter["materials"] = [
    make_mat("hammered-copper", "Hammered Exterior Copper", "#C17137", ["#834217", "#502306", "#F4BF87"], 0.92, 0.28, 0.75, [
        {"region": "dimple-valleys", "effect": "darker patina + higher roughness", "patinaColor": "#4a1e08", "cavityBias": 0.8},
        {"region": "lower-heat-zone", "effect": "warm darkened copper near bottom foot", "patinaColor": "#502306", "streak": "vertical"},
    ]),
    make_mat("brass-interior", "Brushed Golden Brass Interior", "#C78E44", ["#9C6624", "#F4BF87", "#6B4112"], 0.90, 0.24, 0.35, [
        {"region": "interior-bowl", "effect": "radial concentric spun-metal brush streaks", "roughness": 0.22},
    ]),
    make_mat("rim-brass", "Polished Rolled Rim Brass-Copper", "#D99F57", ["#B37632", "#F7D39C"], 0.94, 0.20, 0.25, [
        {"region": "rim-crown", "effect": "bright specular bevel highlight", "roughness": 0.16},
    ]),
]

def comp(cid, name, level, role, prim, tclass, trat, parent, mat, dims, pos, attach=None, local_feats=None, lathe_prof=None):
    c = {
        "id": cid,
        "name": name,
        "level": level,
        "role": role,
        "importance": 0.95 if level == "macro" else 0.75,
        "confidence": 0.92,
        "primitive": prim,
        "topologyClass": tclass,
        "topologyRationale": trat,
        "geometryDescriptor": {
            "topologyIntent": "smooth manifold radial lathe profile with hammered relief",
            "edgeTreatment": {"type": "chamfer", "bevelRadius": 0.004, "segments": 3},
            "deformationStack": ["hammered-voronoi-dimple-displacement"] if "belly" in cid else [],
            "uvStrategy": "cylindrical radial UV wrap",
            "normalStrategy": "analytic smooth vertex normals plus tangent normal map",
        },
        "parent": parent,
        "attachment": attach,
        "dimensions": {"width": dims[0], "height": dims[1], "depth": dims[2], "units": "meters", "confidence": 0.92},
        "transform": {"position": pos, "rotation": [0, 0, 0], "scale": [1, 1, 1]},
        "actionProfile": {
            "animationRole": "root" if parent is None else "static-part",
            "pivot": {"mode": "base" if parent is None else "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.95},
            "transformChannels": {"translate": True, "rotate": True, "scale": True, "bend": False, "twist": False, "detach": False, "visibility": True, "materialState": True},
            "sockets": [{"id": "rice-cavity", "localPosition": [0, 0.075, 0], "radius": 0.115}, {"id": "rim-top", "localPosition": [0, 0.158, 0], "radius": 0.138}] if parent is None else [],
            "collider": {"type": "cylinder", "offset": [0, dims[1] * 0.5, 0], "scale": dims, "isTrigger": False, "notes": "Vessel collider"},
            "constraints": [],
            "destruction": {"breakable": False, "fractureGroup": "vessel-body", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": mat},
        },
        "material": mat,
        "materialLayers": [mat],
        "colorMaterialRecipe": {
            "materialClass": "metal",
            "materialClassConfidence": 0.92,
            "dominantAlbedo": "rgba(193, 113, 55, 1.0)",
            "secondaryAlbedo": "rgba(131, 66, 23, 1.0)",
            "finishStyle": "hammered-metallic",
            "roughnessRange": [0.18, 0.38],
        },
        "deformations": [],
        "joints": [],
        "seams": [],
        "localFeatures": local_feats or [],
        "surfaceDetail": {"macroRoughness": 0.28, "microRoughness": 0.22, "bumpAmplitude": 0.012, "normalPattern": "hammered-dimples", "displacementPattern": "voronoi-facets", "occlusionPattern": "dimple-crease", "edgeWearPattern": "rim-polish", "notes": "Hammered copper vessel surface"},
        "evidenceRefs": ["full-object"],
        "details": [],
        "fidelityTier": "hero",
    }
    if lathe_prof:
        c["geometryDescriptor"]["latheProfile"] = lathe_prof
    return c

def attach_cfg(psock, start, end, overlap=0.025):
    return {
        "parentSocket": psock,
        "localStart": start,
        "localEnd": end,
        "contactType": "overlap",
        "embedDepth": overlap,
        "overlap": overlap,
        "gapTolerance": 0.002,
    }

lathe_outer = {
    "segments": 72,
    "points": [
        [0.0, 0.0], [0.055, 0.002], [0.095, 0.015], [0.130, 0.042],
        [0.143, 0.072], [0.138, 0.102], [0.115, 0.128], [0.113, 0.135],
        [0.136, 0.154], [0.141, 0.159], [0.134, 0.160], [0.128, 0.154],
        [0.107, 0.131], [0.132, 0.098], [0.135, 0.068], [0.118, 0.036],
        [0.080, 0.016], [0.0, 0.011],
    ],
}

starter["componentTree"] = [
    comp("root", "Copper Handi Vessel Root", "macro", "body", "lathe", "continuous-sculpt",
         "Lathed rotational vessel silhouette with continuous belly, neck, and rolled rim.", None, "hammered-copper",
         [0.286, 0.160, 0.286], [0, 0, 0], None, [{"type": "bevel highlight", "placement": "rim"}], lathe_outer),
    comp("copper-belly-shell", "Hammered Exterior Belly Shell", "macro", "body", "lathe", "continuous-sculpt",
         "Exterior rounded copper belly exhibiting hammered circular facets.", "root", "hammered-copper",
         [0.286, 0.130, 0.286], [0, 0, 0], attach_cfg("root-center", [0, 0, 0], [0, 0.13, 0]),
         [{"type": "chip or dent", "placement": "exterior-belly"}], lathe_outer),
    comp("interior-bowl-liner", "Brushed Brass Interior Bowl", "macro", "body", "lathe", "continuous-sculpt",
         "Hollow brushed golden-brass inner bowl wall and floor.", "root", "brass-interior",
         [0.268, 0.145, 0.268], [0, 0.01, 0], attach_cfg("root-center", [0, 0.01, 0], [0, 0.15, 0]),
         [{"type": "scratch cluster", "placement": "interior-wall"}], lathe_outer),
    comp("flared-neck-collar", "Flared Neck Collar", "meso", "rim", "lathe", "continuous-sculpt",
         "Constricted throat transitioning smoothly into flared top collar.", "copper-belly-shell", "rim-brass",
         [0.272, 0.032, 0.272], [0, 0.125, 0], attach_cfg("belly-top", [0, 0.125, 0], [0, 0.157, 0]),
         [{"type": "recessed groove", "placement": "neck-throat"}]),
    comp("rolled-rim-lip", "Rolled Rim Bead", "meso", "rim", "torus", "continuous-sculpt",
         "Rolled rounded top rim torus ring.", "flared-neck-collar", "rim-brass",
         [0.278, 0.008, 0.278], [0, 0.157, 0], attach_cfg("collar-top", [0, 0.154, 0], [0, 0.160, 0]),
         [{"type": "bevel highlight", "placement": "rim-top"}]),
    comp("vessel-base-foot", "Rounded Base Foot", "meso", "base", "cylinder", "assembled-solid",
         "Darkened bottom base contact area resting at y=0.", "copper-belly-shell", "hammered-copper",
         [0.120, 0.012, 0.120], [0, 0.006, 0], attach_cfg("belly-bottom", [0, 0, 0], [0, 0.012, 0]),
         [{"type": "stain or dirt patch", "placement": "bottom-foot"}]),
    comp("shoulder-transition-band", "Upper Shoulder Transition", "meso", "trim", "torus", "assembled-solid",
         "Subtle ridge where hammered belly meets brushed neck.", "copper-belly-shell", "hammered-copper",
         [0.230, 0.006, 0.230], [0, 0.128, 0], attach_cfg("belly-neck", [0, 0.125, 0], [0, 0.132, 0]),
         [{"type": "seam line", "placement": "neck-shoulder"}]),
    comp("inner-rim-fillet", "Inner Rim Fillet", "meso", "trim", "torus", "assembled-solid",
         "Inner lip curve bridging flared collar to interior wall.", "flared-neck-collar", "brass-interior",
         [0.264, 0.007, 0.264], [0, 0.155, 0], attach_cfg("collar-inner", [0, 0.152, 0], [0, 0.158, 0]),
         [{"type": "bevel highlight", "placement": "inner-lip"}]),
    comp("belly-mid-band", "Mid-Belly Hammered Band", "meso", "trim", "torus", "assembled-solid",
         "Primary specular highlight band around maximum vessel girth.", "copper-belly-shell", "hammered-copper",
         [0.286, 0.010, 0.286], [0, 0.070, 0], attach_cfg("belly-equator", [0, 0.065, 0], [0, 0.075, 0]),
         [{"type": "chip or dent", "placement": "belly-equator"}]),
    comp("lower-belly-patina-band", "Lower Heat-Patina Band", "meso", "trim", "torus", "assembled-solid",
         "Heat-darkened lower curvature band above base foot.", "copper-belly-shell", "hammered-copper",
         [0.236, 0.010, 0.236], [0, 0.028, 0], attach_cfg("belly-lower", [0, 0.022, 0], [0, 0.034, 0]),
         [{"type": "stain or dirt patch", "placement": "lower-belly"}]),
    comp("interior-floor-disc", "Interior Floor Disc", "meso", "base", "cylinder", "assembled-solid",
         "Slightly domed interior bottom floor.", "interior-bowl-liner", "brass-interior",
         [0.140, 0.006, 0.140], [0, 0.012, 0], attach_cfg("interior-bottom", [0, 0.010, 0], [0, 0.016, 0]),
         [{"type": "scratch cluster", "placement": "interior-floor"}]),
    comp("hammered-dimple-group-upper", "Upper Belly Hammered Dimples", "micro", "surface-detail", "instanced-cluster", "assembled-solid",
         "Planished circular dimple facets around upper shoulder.", "copper-belly-shell", "hammered-copper",
         [0.260, 0.030, 0.260], [0, 0.100, 0], attach_cfg("belly-upper", [0, 0.095, 0], [0, 0.115, 0]),
         [{"type": "chip or dent", "placement": "upper-shoulder"}]),
    comp("hammered-dimple-group-mid", "Mid Belly Hammered Dimples", "micro", "surface-detail", "instanced-cluster", "assembled-solid",
         "Primary circular hammered dimple grid at belly equator.", "copper-belly-shell", "hammered-copper",
         [0.286, 0.040, 0.286], [0, 0.070, 0], attach_cfg("belly-equator", [0, 0.055, 0], [0, 0.085, 0]),
         [{"type": "chip or dent", "placement": "mid-belly"}]),
    comp("hammered-dimple-group-lower", "Lower Belly Hammered Dimples", "micro", "surface-detail", "instanced-cluster", "assembled-solid",
         "Planished circular facets curving toward base.", "copper-belly-shell", "hammered-copper",
         [0.240, 0.030, 0.240], [0, 0.035, 0], attach_cfg("belly-lower", [0, 0.025, 0], [0, 0.045, 0]),
         [{"type": "chip or dent", "placement": "lower-belly"}]),
    comp("rim-polish-micro-streaks", "Rim Lathe Polish Micro-Grooves", "micro", "surface-detail", "torus", "assembled-solid",
         "Fine concentric spinning marks on flared brass rim.", "flared-neck-collar", "rim-brass",
         [0.260, 0.004, 0.260], [0, 0.148, 0], attach_cfg("collar-face", [0, 0.145, 0], [0, 0.151, 0]),
         [{"type": "scratch cluster", "placement": "flared-rim"}]),
    comp("interior-brush-micro-rings", "Interior Concentric Brush Rings", "micro", "surface-detail", "torus", "assembled-solid",
         "Fine circular brushed grain inside brass bowl.", "interior-bowl-liner", "brass-interior",
         [0.240, 0.004, 0.240], [0, 0.090, 0], attach_cfg("interior-wall", [0, 0.085, 0], [0, 0.095, 0]),
         [{"type": "scratch cluster", "placement": "interior-wall"}]),
]

starter["repetitionSystems"] = [
    {
        "id": "hammered-dimple-lattice",
        "type": "radial-staggered-dimples",
        "count": 240,
        "targetComponent": "copper-belly-shell",
        "notes": "Staggered concentric rings of planished hammer indentations across exterior copper belly.",
    }
]

starter["featureReviewTargets"] = [
    {"id": "handi-lathe-silhouette", "name": "Bulbous Belly and Flared Rolled Rim Silhouette", "tier": "critical", "passIds": ["blockout", "structural-pass"], "minimumScore": 0.85, "mustPass": True, "componentRefs": ["root", "copper-belly-shell", "rolled-rim-lip"], "evidenceRefs": ["full-object"]},
    {"id": "handi-hollow-bowl", "name": "Hollow Interior Bowl for Biryani Assembly", "tier": "critical", "passIds": ["structural-pass", "form-refinement"], "minimumScore": 0.85, "mustPass": True, "componentRefs": ["interior-bowl-liner"], "evidenceRefs": ["full-object"]},
    {"id": "handi-hammered-copper-pbr", "name": "Hammered Dimple Relief and Copper/Brass PBR Contrast", "tier": "critical", "passIds": ["material-pass", "surface-pass"], "minimumScore": 0.80, "mustPass": True, "componentRefs": ["copper-belly-shell", "interior-bowl-liner"], "evidenceRefs": ["full-object"]},
]

starter["lightingFromPhoto"] = [
    {"id": "key-light", "type": "directional", "role": "key light", "color": "#fff1dc", "intensity": 2.4, "position": [1.6, 2.4, 1.8], "notes": "Warm studio overhead-right key light matching copper specular hotspots; ACESFilmic tone mapping, exposure 1.15, dark studio backdrop with soft contact shadow."},
    {"id": "fill-light", "type": "directional", "role": "fill light", "color": "#dce8ff", "intensity": 0.85, "position": [-2.0, 1.1, 1.2], "notes": "Soft cool fill light preserving hammered dimple shadow contrast."},
    {"id": "rim-light", "type": "directional", "role": "rim or environment light", "color": "#ffcf99", "intensity": 1.5, "position": [-0.4, 1.8, -2.2], "notes": "Warm rim + PMREM RoomEnvironment reflection on copper rim and interior bowl."},
]

out_path = Path("public/3d-assets/source/copper-handi/object-sculpt-spec.json")
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text(json.dumps(starter, indent=2) + "\n", encoding="utf-8")
print("Wrote", out_path)
