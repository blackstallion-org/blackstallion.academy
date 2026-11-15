#!/usr/bin/env python3
"""
Publishes the owner's horse photographs as optimized derivatives and writes the provenance manifest.

Source:  `real marwari horse images/` (106 originals, kept unedited and git-ignored).
Output:  public/images/horses/real/<gallery>/<view>.webp and lib/content/real-horses.manifest.json

Curation (14 Nov 2026, reviewed photo by photo on contact sheets and full-size corner crops):
  * A gallery holds ONE individual horse: only photos from the same session whose markings, tack and setting agree.
    Similar-looking horses from different sessions are not merged, even when they may be the same animal.
  * Photos with a third-party watermark or photographer signature are excluded; no watermark is removed or cropped away.
  * Photos showing identifiable people, collages, screenshots and duplicates are excluded.
  * Edits are limited to re-encoding (WebP, quality 82, long edge at most 1800 px) and stripping all metadata (EXIF/GPS).
    No retouching, cropping or change to the horse.
  * The owner confirmed in chat on 14 Nov 2026 that they have permission to publish the unwatermarked photos.

Run: python3 scripts/build-real-horse-gallery.py
"""
import hashlib, json, os, subprocess, tempfile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "real marwari horse images")
OUT = os.path.join(ROOT, "public", "images", "horses", "real")
MANIFEST = os.path.join(ROOT, "lib", "content", "real-horses.manifest.json")

G = lambda slug, title, setting, note, images: dict(slug=slug, title=title, setting=setting, note=note, images=images)
I = lambda source, view, label, caption, alt: dict(source=source, view=view, label=label, caption=caption, alt=alt)

GALLERIES = [
    G("horse-study-01", "Horse Study 01", "Painted green backdrop", "One black horse with a broad white blaze and pink muzzle, photographed in a single studio session.", [
        I("igexport-Ddb2wnllJFB-5.jpg", "three-quarter-left", "Three-quarter, left", "Head and neck turned toward the lens; the blaze runs from forelock to muzzle.", "A black horse with a broad white blaze and inward-curving ears against a mottled green backdrop, head turned toward the camera."),
        I("igexport-Ddb2wnllJFB-2.jpg", "front", "Front", "Square to the camera, ears pricked and curled inward.", "A black horse facing the camera head-on against a green backdrop, ears curving inward until the tips nearly meet."),
        I("igexport-Ddb2wnllJFB-4.jpg", "head-profile-right", "Head, right profile", "The right side of the head: eye, cheek and the edge of the blaze.", "Close right-side profile of a black horse's head with a white blaze and pink muzzle against a green backdrop."),
        I("igexport-Ddb2wnllJFB.jpg", "neck-three-quarter-right", "Neck, three-quarter right", "The arch of the neck from the right, mane falling to the far side.", "A black horse's head and arched neck seen from the right against a green backdrop."),
    ]),
    G("horse-study-02", "Horse Study 02", "White studio, embroidered saddle cloth", "One black horse in a silver-mounted bridle and gold-fringed saddle cloth, photographed on a rug in a white studio.", [
        I("snapgram.io_uokah86144rw.jpg", "side-left", "Side, left", "Full side view: saddle, fringed cloth and the line of the back.", "A black horse in a saddle and gold-fringed embroidered saddle cloth standing side-on on a rug in a white studio."),
        I("snapgram.io_sc2zrer2n0g0.jpg", "three-quarter-right", "Three-quarter, right", "Standing square on the rug, reins loose to the floor.", "The same black horse in saddle and embroidered cloth seen three-quarters from the front in a white studio."),
        I("snapgram.io_epyoir2nbi3l.jpg", "head-front", "Head, front", "Silver browband and noseband; plaited forelock.", "Front view of a black horse's head in a silver-mounted bridle with a plaited forelock against white."),
        I("snapgram.io_x6t67gek4s3i.jpg", "eye-detail", "Eye detail", "The eye and the silver bridle fittings at close range.", "Close detail of a black horse's eye and silver bridle buckles."),
    ]),
    G("horse-study-03", "Horse Study 03", "Desert sand, red bead necklace", "One black horse with a white face marking, gold pendant and red bead necklace, photographed on open sand.", [
        I("igexport-Cp_uoQnrK8o-3.webp", "three-quarter-right", "Three-quarter, right", "Standing on the sand, head raised and turned right.", "A black horse with a white face marking, a gold pendant and red bead necklace standing on desert sand, head turned right."),
        I("igexport-Cp_uoQnrK8o.webp", "front", "Front", "Facing the lens, ears curled inward above the white face.", "A black horse facing the camera on a desert morning, wearing a gold pendant and red bead necklace."),
    ]),
    G("horse-study-04", "Horse Study 04", "Palace courtyard, gold coin necklace", "One black horse in a gold coin necklace and red-tasselled bridle, photographed in a palace courtyard.", [
        I("655043770_18002014481901141_3790890925898584209_n.jpg", "side-right-foreleg-raised", "Side, right, foreleg raised", "A foreleg lifted beside the courtyard steps, rose petals on the ground.", "A black horse in a gold coin necklace stands side-on by palace steps with one foreleg raised."),
        I("655951726_18078627215621368_3603954779019632760_n.jpg", "head-neck-right", "Head and neck, right", "The coin necklace and red tassel against a painted wall.", "A black horse's head and neck in a gold coin necklace and red-tasselled bridle before a painted wall."),
    ]),
    G("horse-study-05", "Horse Study 05", "Red-pink wall, movement", "One black horse with a small star, photographed in motion along the same red-pink wall.", [
        I("igexport-DfcSnKfmA_q-6.webp", "moving-right-step", "Moving right, onto the step", "Stepping up onto a stone ledge in front of the arches.", "A black horse with a white star moving to the right onto a stone ledge in front of a red-pink arched wall."),
        I("igexport-DfcSnKfmA_q-8.webp", "moving-right", "Moving right", "Mid-stride along the wall, a hind sock showing.", "A black horse with a white star in mid-stride to the right along a red-pink wall, kicking up sand."),
    ]),
    G("horse-study-06", "Horse Study 06", "Black and white, paddock fence", "One dark horse with a small star, photographed in black and white by the same paddock fence.", [
        I("igexport-Dc2k3h2CVx_-2.jpg", "front", "Front", "Head-on by the fence, the star centred between the eyes.", "Black-and-white photograph of a dark horse with a small star facing the camera in front of a paddock fence."),
        I("igexport-Dc2k3h2CVx_-4.jpg", "three-quarter-right", "Three-quarter, right", "The head turned slightly, ears curled inward.", "Black-and-white photograph of the same dark horse, head turned slightly to the right, by a paddock fence."),
    ]),
    G("horse-study-07", "Horse Study 07", "Lakeside, rope halter", "One dark bay horse with a wide blaze, photographed on a lead by the same lake.", [
        I("snapgram.io_wclkb2mrkvu2.jpg", "front", "Front", "Square to the lens on the lead, the lake behind.", "A dark bay horse with a wide white blaze and pink muzzle facing the camera on a lead rope, a lake behind."),
        I("snapgram.io_y9s97ru820jw.jpg", "three-quarter-left", "Three-quarter, left", "Head turned left, the neck arched over the halter.", "The same dark bay horse with a wide white blaze, head turned to the left, a lake behind."),
    ]),
    G("horse-study-08", "Horse Study 08", "Pale sky, chain halter", "One dark bay horse with a narrower blaze, photographed on a lead against the same pale sky.", [
        I("snapgram.io_gdts7tdw8ypc.jpg", "head-front", "Head, front", "Ears curled inward, eyes on the handler.", "A dark bay horse with a white blaze and pink muzzle facing forward against a pale sky, lead rope to the left."),
        I("snapgram.io_sebh9g867lww.jpg", "head-three-quarter-right", "Head, three-quarter right", "The neck arched, the lead running off to the right.", "The same dark bay horse with a white blaze, head turned slightly, lead rope to the right against a pale sky."),
    ]),
]

# Single photographs: clean and permitted, but not tied to another photo of the same horse, so they are NOT individual galleries.
COLLECTION = [
    ("475078179_18051169445327500_3353036630209406679_n.jpg", "chestnut-white-columns", "A chestnut horse with a blaze and white socks standing between carved white marble columns."),
    ("478845553_18051169439327500_7900539700491032707_n.jpg", "bay-blue-steps", "A dark bay horse in gold tack standing before blue-washed temple steps and a red door."),
    ("479697795_18051169442327500_129746274539932211_n.jpg", "black-head-fresco", "A black horse with a white blaze before a painted fresco wall, ears curled inward."),
    ("479700764_18051169466327500_3802861664986471510_n.jpg", "black-between-columns", "A black horse in a silver necklace standing between carved columns."),
    ("654714909_18004970894898080_2607768664120257827_n.jpg", "black-yellow-wall", "A black horse with white socks, foreleg raised, before an ochre wall."),
    ("900765595_18029222138872648_7508977358709142222_n.jpg", "rearing-palms", "A dark bay horse rearing on sand in front of palm trees and a tiled-roof stable."),
    ("igexport-C7JQghxr6CA.webp", "black-dry-scrub", "A black horse with a white blaze and socks standing in dry scrubland."),
    ("igexport-DfCrIWjz_Qx (1).heic", "mare-and-foal", "A black mare in tasselled tack with her foal in a sandstone fort courtyard."),
    ("igexport-DfcSnKfmA_q-3.webp", "leap-dust", "A dark horse leaping through golden dust, lit from behind."),
    ("igexport-DfcSnKfmA_q-7.webp", "approach-dust", "A dark horse walking toward the camera through hazy dust."),
    ("snapgram.io_1n6e4si53wua.webp", "carpet-narrow-blaze", "A black horse with a narrow blaze photographed against a patterned carpet."),
    ("snapgram.io_3mkpon6wf9wg.webp", "carpet-red-tassels", "A black horse with a broad blaze in a red-tasselled silver necklace against a patterned carpet."),
    ("snapgram.io_6ld9gvsz7y72.webp", "carpet-pair", "A black horse and a white horse standing side by side against a patterned carpet."),
    ("snapgram.io_ixyik2hyt5dc.webp", "carpet-broad-blaze", "A black horse with a broad white blaze facing the camera against a patterned carpet."),
    ("snapgram.io_kcg6gqaldlp9.webp", "carpet-bay-head", "Close portrait of a dark bay horse with a long blaze against a patterned carpet."),
    ("snapgram.io_pezpwb80jwv4.webp", "carpet-piebald", "A black-and-white horse with a blaze turning its head against a patterned carpet."),
    ("snapgram.io_4urbm09qdqp0.jpg", "rearing-dust", "A dark horse rearing in warm dust under bare trees."),
    ("snapgram.io_ga9ilsi9jt2q.jpg", "bay-trotting-dust", "A bay horse trotting through golden dust beneath trees."),
    ("snapgram.io_jay7np3a34ux.jpg", "chestnut-going-away", "A chestnut horse trotting away through misty scrub."),
    ("snapgram.io_v0acy8dsjcp8.jpg", "bay-garden", "A glossy bay horse standing side-on on a lawn before a garden hedge."),
    ("snapgram.io_ypuxmlvkykg8.jpg", "black-green-field", "A black horse with white socks standing side-on in a green field."),
    ("igexport-DfcSnKfmA_q.webp", "stable-door", "A dark horse with a gold necklace stepping out of a shadowed doorway."),
]

WATERMARK_DRUZ = "Third-party photographer watermark (Ekaterina Druz Equine Photography); not removed, photo excluded."
WATERMARK_DEEWANA = "Photographer signature watermark in a corner; not removed, photo excluded."


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def open_image(path):
    if path.lower().endswith(".heic"):
        tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False).name
        subprocess.run(["sips", "-s", "format", "jpeg", path, "--out", tmp], check=True, capture_output=True)
        return Image.open(tmp)
    return Image.open(path)


def publish(source, dest_rel):
    src = os.path.join(SRC, source)
    im = open_image(src)
    im.load()
    im = im.convert("RGB")  # drops EXIF/GPS/ICC-carried metadata with the original container
    w, h = im.size
    scale = min(1.0, 1800 / max(w, h))
    if scale < 1:
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    dest = os.path.join(OUT, dest_rel)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    im.save(dest, "WEBP", quality=82, method=6)
    return dict(width=im.size[0], height=im.size[1], source_width=w, source_height=h, bytes=os.path.getsize(dest))


def main():
    originals = sorted(f for f in os.listdir(SRC) if not f.startswith("."))
    used = {}
    galleries = []
    for g in GALLERIES:
        imgs = []
        for it in g["images"]:
            rel = f"{g['slug']}/{it['view']}.webp"
            info = publish(it["source"], rel)
            used[it["source"]] = f"gallery {g['slug']} ({it['view']})"
            imgs.append(dict(file=f"/images/horses/real/{rel}", source=it["source"], sha256=sha256(os.path.join(SRC, it["source"])),
                             view=it["view"], label=it["label"], caption=it["caption"], alt=it["alt"],
                             edits="Re-encoded to WebP (q82), metadata stripped; no crop or retouching.", **info))
        galleries.append(dict(slug=g["slug"], title=g["title"], setting=g["setting"], note=g["note"], images=imgs))
    collection = []
    for source, name, alt in COLLECTION:
        rel = f"collection/{name}.webp"
        info = publish(source, rel)
        used[source] = f"collection ({name})"
        collection.append(dict(file=f"/images/horses/real/{rel}", source=source, sha256=sha256(os.path.join(SRC, source)), alt=alt,
                               edits="Re-encoded to WebP (q82), metadata stripped; no crop or retouching.", **info))
    reasons = REASONS
    records = []
    for f in originals:
        p = os.path.join(SRC, f)
        try:
            im = open_image(p); im.load(); dims = im.size; ok = True
        except Exception:
            dims = (None, None); ok = False
        if f in used:
            status, why = "published", used[f]
        else:
            status, why = "excluded", reasons.get(f, "Clean, but not used: a single view of a horse that could not be matched to another photo, or a near-duplicate of a published view.")
        records.append(dict(source=f, sha256=sha256(p), width=dims[0], height=dims[1], decodes=ok, status=status, decision=why))
    manifest = dict(
        generated="2026-11-14",
        source_folder="real marwari horse images/ (originals unedited, git-ignored)",
        rights="Owner confirmed in chat on 14 Nov 2026 that they have permission to publish the unwatermarked photos. Photos carrying a third-party watermark or signature are excluded and nothing was removed from any photo.",
        identity="Galleries are grouped by individual horse only where photos come from one session with matching markings, tack and setting. No names, breed claims, pedigree or ownership are attached; none is an academy fleet record.",
        totals=dict(originals=len(originals), published=sum(r["status"] == "published" for r in records), excluded=sum(r["status"] == "excluded" for r in records),
                    galleries=len(galleries), gallery_images=sum(len(g["images"]) for g in galleries), collection_images=len(collection)),
        galleries=galleries, collection=collection, originals=records)
    with open(MANIFEST, "w") as fh:
        json.dump(manifest, fh, indent=1, ensure_ascii=False)
    print(json.dumps(manifest["totals"]))


REASONS = {
    "480072575_18051169457327500_8708034105836023836_n.jpg": "Alternative crop of the same photograph used in Horse Study 04 (side view); duplicate.",
    "653397109_17984908247958028_2622112065246996324_n.jpg": "Collage of several photographs, not a single image; excluded.",
    "Dd0g5DfDyQI_0.jpg": "Screenshot from an image search (lens icon) showing identifiable people; excluded.",
    "Dd0g5DfDyQI_1.jpg": "Low-resolution crop with a person or tack filling the frame; identity not verifiable.",
    "Dd0g5DfDyQI_2.jpg": "Low-resolution crop with a person or tack filling the frame; identity not verifiable.",
    "Dd0g5DfDyQI_3.jpg": "Stock agency watermark (Alamy) and an identifiable person; excluded.",
    "Dd0g5DfDyQI_4.jpg": "Screenshot from an image search (lens icon) showing identifiable people; excluded.",
    "igexport-BZCB9kzjnAv.jpg": WATERMARK_DRUZ,
    "igexport-Bd-cEd2nm_I.jpg": WATERMARK_DRUZ,
    "igexport-Cp_uoQnrK8o-2.webp": "Remnant of a cropped watermark at the lower left; not removed further, photo excluded.",
    "igexport-Cp_uoQnrK8o-4.webp": "Photographer watermark (\"…photography\" at the lower edge); not removed, photo excluded.",
    "igexport-Cp_uoQnrK8o-5.webp": "Photographer watermark (Gill Photography); not removed, photo excluded.",
    "igexport-DdLNqEVoh4z.webp": "Scanned print with a date imprint across the lower edge; excluded.",
    "igexport-Ddb2wnllJFB-3.jpg": "Same studio as Horse Study 01, but the blaze and muzzle do not clearly match the other four views; left ungrouped and unpublished.",
    "igexport-DfCrIWjz_Qx.heic": "Byte-for-byte duplicate of the mare-and-foal HEIC already published.",
    "igexport-DfcSnKfmA_q-10.webp": "Identifiable person in the frame and cropping would remove the horse's context; excluded.",
    "igexport-DfcSnKfmA_q-2.webp": WATERMARK_DRUZ,
    "igexport-DfcSnKfmA_q-9.webp": "Identifiable person in the frame and cropping would remove the horse's context; excluded.",
    "snapgram.io_0tp1m2xgu4jw.jpg": "Collage of several photographs, not a single image; excluded.",
    "snapgram.io_1gfha79brvvo.jpg": "Identifiable person in the frame and cropping would remove the horse's context; excluded.",
    "snapgram.io_1q1p6xzsgtfo.webp": WATERMARK_DRUZ,
    "snapgram.io_32rqc2qxv8yp.jpg": WATERMARK_DEEWANA,
    "snapgram.io_3inzrxftg8dr.jpg": WATERMARK_DEEWANA,
    "snapgram.io_449xe6jyjn6v.jpg": WATERMARK_DEEWANA,
    "snapgram.io_49nanx6yogse.webp": WATERMARK_DRUZ,
    "snapgram.io_49td5s7x36kg.jpg": WATERMARK_DEEWANA,
    "snapgram.io_5j4czxped8w9.webp": WATERMARK_DRUZ,
    "snapgram.io_9tsrsg2q4ivi.webp": WATERMARK_DRUZ,
    "snapgram.io_cexj410v30z7.jpg": WATERMARK_DEEWANA,
    "snapgram.io_djxutu8bvta0.webp": WATERMARK_DRUZ,
    "snapgram.io_dofkils89vf6.jpg": "Same farm sessions as Horse Studies 07 and 08, but this view could not be matched to one of those horses with certainty; unpublished.",
    "snapgram.io_duz9in976m1s.jpg": "Same farm sessions as Horse Studies 07 and 08, but this view could not be matched to one of those horses with certainty; unpublished.",
    "snapgram.io_e8xka0cbrhlg.webp": WATERMARK_DRUZ,
    "snapgram.io_heaq0p1d5rra.jpg": WATERMARK_DEEWANA,
    "snapgram.io_j4s7ksoxsz6x.webp": WATERMARK_DRUZ,
    "snapgram.io_lmubnv7m8ncf.jpg": WATERMARK_DEEWANA,
    "snapgram.io_mbv7dmxhd5om.jpg": WATERMARK_DEEWANA,
    "snapgram.io_p35rokfuo4zm.jpg": "Collage of several photographs, not a single image; excluded.",
    "snapgram.io_rnl2ltzx2xs5.jpg": WATERMARK_DEEWANA,
    "snapgram.io_rtfofdubs2cp.jpg": WATERMARK_DEEWANA,
    "snapgram.io_sz6cfjwgldsy.webp": WATERMARK_DRUZ,
    "snapgram.io_tetjmttm6dmv.jpg": WATERMARK_DEEWANA,
    "snapgram.io_whttk647dhur.jpg": WATERMARK_DEEWANA,
    "snapgram.io_xrc4nn0epcxw.jpg": WATERMARK_DEEWANA,
    "snapgram.io_yw4ftkmlk16d.jpg": "Same farm sessions as Horse Studies 07 and 08, but this view could not be matched to one of those horses with certainty; unpublished.",
    "snapgram.io_zq5txy7kt86l.webp": WATERMARK_DRUZ,
}

if __name__ == "__main__":
    main()
