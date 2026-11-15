# "The Mosaic": prompts for a cinematic opening in the tile-relief style

This is a storyboard in the style of the closed-eye mosaic clip (`public/video/eye-intro-film.mp4` / `.webm`, Oct 2026; not used on the
site at present). There are eight shots, about 24 s in all.

Each shot has two prompts:
- an **image prompt** for ChatGPT image generation (or Higgsfield, Midjourney);
- a **motion prompt** for turning that still into a 3–4 s clip with an image-to-video model (Higgsfield, Kling, Runway, Veo).

Generate every still at 16:9 and 2K, then animate it. When the eight clips exist, they slot into the opening the same way the painted
trailer does (`components/opening/PaintedTrailer.tsx`). The title cards are already written; the copy comes from `/legend` and the
Blueprint's big idea.

## The style block (paste at the start of every image prompt)

> Extreme macro photograph of a relief sculpture made of thousands of tiny hand-cut terracotta and copper ceramic tesserae, each tile
> slightly domed and glazed, laid in flowing rows that follow the form like brush strokes. Warm burnt-sienna, rust and antique-gold
> tones, deep umber shadows between the tiles. Soft single key light from the upper left, shallow depth of field, a fine film grain.
> Museum-quality, tactile, cinematic, no text.

**Negative prompt (if the tool takes one):** text, letters, watermark, logo, cartoon, plastic, glossy CGI, neon, blue tones, modern
objects, flags, weapons pointed at the viewer, blood.

**Cadet line (any shot with a child):** an Indian cadet aged 12 to 14 in the academy riding uniform: navy riding jacket, white
breeches, tall black boots, black velvet helmet with the chin strap fastened.

## The story: eye → horse → lineage → child

| # | Seconds | Card on screen |
|---|---|---|
| 1 | 0–3 | *(none: black, then the tiles)* |
| 2 | 3–6 | MARWAR, 1193 / *a horse was made for the desert.* |
| 3 | 6–9 | THE TIPS TOUCH / *a mark no other breed wears.* |
| 4 | 9–12 | THEY RODE / *into every war.* |
| 5 | 12–15 | THEN THE WORLD / *forgot it.* |
| 6 | 15–18 | ONE LINE / *refused to end.* |
| 7 | 18–21 | AN 800-YEAR LINEAGE, |
| 8 | 21–24 | *handed to your child.* + crest and name |

**1. The eye opens.**
- Image: [style block] Extreme close-up of a horse's closed eye rendered in the tile relief, long lashes made of slender copper
  tiles, the eyelid a smooth curve of tiny tesserae, filling the frame.
- Motion: Very slow push-in. After one second the eyelid lifts and the eye opens; a warm glint appears in the dark glazed iris. The
  tiles stay perfectly still; only the lid moves.

**2. The desert in the eye.**
- Image: [style block] The same horse's eye, wide open, filling the frame. Reflected in the curved glossy iris, made of tiny mirror
  tiles: a desert horizon with a sandstone hill fort and a low red sun.
- Motion: Slow push into the iris until the reflected desert fills the screen; the tiles of the reflection gently ripple like heat
  haze.

**3. The ears.**
- Image: [style block] Profile of a black Marwari stallion's head in the tile relief, the two ears curving inward until their tips
  touch above the forelock, a jewelled bridle picked out in gold-glazed tiles.
- Motion: The camera tilts up slowly from the eye to the touching ear tips. A single row of tiles catches the light and flashes
  along the curve of the ears.

**4. The charge.**
- Image: [style block] Wide relief of Marwari cavalry riding left to right through a cloud of dust, raised banners and parasols,
  every horse and rider built of tiny tiles, the dust made of scattered loose tesserae.
- Motion: A fast lateral track left to right. Loose tiles lift off the ground like dust and drift across the frame. A subtle shake
  on the first beat.

**5. Forgotten.**
- Image: [style block] A pale horse pulling a cart past an empty arched stable, the relief cracked and weathered, many tiles
  missing and grey, colour drained to sepia.
- Motion: Almost still. A few loose tiles fall from the relief one by one. The colour fades further. Slow drift right.

**6. The foal.**
- Image: [style block] A breeder in a turban kneeling to touch a grey spotted foal at a stone trough, fresh bright tiles growing
  across the old cracked ones, warm light returning.
- Motion: The camera pushes in gently while new tiles click into place across the cracks, spreading outward from the foal like
  sunrise.

**7. The pull-back.**
- Image: [style block] [cadet line]. The cadet stands at dawn facing a black Marwari, holding its reins, both rendered in the tile
  relief, a sandstone arena behind.
- Motion: A slow pull-back revealing the whole relief. The horse's head lowers toward the cadet's open hand.

**8. The crest.**
- Image: [style block] The tile relief of the horse and cadet is seen from far back, and the tiles around them form a circular
  heraldic medallion with a rearing black stallion at its centre, framed by a ring of gold tiles. Dark background.
- Motion: The medallion settles into place, a ring of gold light runs once around its edge, then it holds still. Leave the lower
  third clear for the name.

## Shorter or other cuts

- **12 s teaser:** shots 1, 3, 7, 8.
- **Breed story:** 1, 2, 3, then a new shot (the amble on a desert road, the same style block), then 8.
- **Matching an existing clip:** to match the existing eye clip exactly, give the image tool that clip's first frame as a reference
  image and ask for "the same tile relief style".

## Music

Use the trailer score (`public/audio/music/opening-trailer.mp3`, cut to the painted trailer's beats). Its quiet 13.6–17.2 s window
lines up with shot 5 if the cut starts it at 1.4 s, so the timings above may shift by up to a second when the clips are edited
together.
