#!/bin/sh
# Marwar archive, step 2: web versions and runtime copies (needs ffmpeg + cwebp).
#
# - Archive photographs 101–103: long edge 2400, greyscale, gentle contrast, a light static grain, WebP q82.
#   (001–011 already have reviewed web versions in british-archive/web and are copied as they are.)
# - 101 is a book plate: cropped to the printed page (rules and caption kept), not to the bare photograph.
# - 104 is a painting: colour kept, no grain.
# - Runtime copies: public/images/history/marwar/archive/<id>.webp and scenes/<scene>-<layer>.webp
# - Video: the two AI-generated studio films re-encoded to 1280 px H.264 without audio, plus WebP posters.
#
# Usage: sh scripts/marwar-archive-build.sh
set -eu
cd "$(dirname "$0")/.."

SRC=output/imagegen/marwar-story
ARC=$SRC/british-archive
PUB=public/images/history/marwar
TMP=$(mktemp -d)
mkdir -p "$ARC/web" "$PUB/archive" "$PUB/scenes" public/video/marwar

photo() { # in out [crop]
  vf="${3:+$3,}scale='if(gt(iw,ih),min(2400,iw),-2)':'if(gt(iw,ih),-2,min(2400,ih))':flags=lanczos,format=gray,eq=contrast=1.06:gamma=0.98,noise=alls=5:allf=u"
  ffmpeg -v error -y -i "$1" -vf "$vf" "$TMP/x.png"
  cwebp -quiet -q 82 -m 6 "$TMP/x.png" -o "$2"
}

photo "$ARC/masters/101-jaswant-singh-ii-bourne-shepherd-c1877.jpg" "$ARC/web/101-jaswant-singh-ii-bourne-shepherd-c1877.webp" "crop=2230:3230:4200:530"
photo "$ARC/masters/102-mehrangarh-fort-boeck-1903.jpg" "$ARC/web/102-mehrangarh-fort-boeck-1903.webp"
photo "$ARC/masters/103-jodhpur-state-elephant-boeck-1903.jpg" "$ARC/web/103-jodhpur-state-elephant-boeck-1903.webp"
ffmpeg -v error -y -i "$ARC/masters/104-man-singh-mahamandir-bulaki-1815.jpg" "$TMP/p.png"
cwebp -quiet -q 86 -m 6 "$TMP/p.png" -o "$ARC/web/104-man-singh-mahamandir-bulaki-1815.webp"

# Runtime copies: archive (short ids) ------------------------------------------------------------------------------
for f in "$ARC"/web/0[0-1][0-9]-*.webp "$ARC"/web/10[1-4]-*.webp; do
  id=$(basename "$f" | cut -d- -f1)
  cp "$f" "$PUB/archive/$id.webp"
done

# Runtime copies: the five painted scenes --------------------------------------------------------------------------
for s in 01-horsemen 02-british-enter 03-jodhpur-lancers 04-pratap-singh 05-living-legacy; do
  for layer in background subject composite; do
    cp "$SRC/$s-$layer.webp" "$PUB/scenes/$s-$layer.webp"
  done
done

# Video -----------------------------------------------------------------------------------------------------------
enc() { # in out-stem
  ffmpeg -v error -y -i "$1" -an -vf "scale=1280:-2:flags=lanczos" -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart "$2.mp4"
  ffmpeg -v error -y -ss 0.2 -i "$1" -frames:v 1 -vf "scale=1280:-2" "$TMP/poster.png"
  cwebp -quiet -q 80 "$TMP/poster.png" -o "$2-poster.webp"
}
enc "public/video/Marwari_stallion_studio_portrait_e5af1963_1080p (1).mp4" public/video/marwar/stallion-portrait
enc public/video/Black_horse_ears_animating_996bac38_1080p.mp4 public/video/marwar/stallion-ears

rm -rf "$TMP"
ls -la "$PUB/archive" "$PUB/scenes" public/video/marwar
