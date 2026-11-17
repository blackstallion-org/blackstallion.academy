#!/bin/sh
# After `npm run render` (picture) and `sh scripts/mix-audio.sh` (sound), builds:
#   out/bsah-lineage-1080p.mp4               master with sound, for social and pitch use
#   ../public/video/the-lineage.mp4           web cut, 1080p   (the /film page)
#   ../public/video/the-lineage-mobile.mp4    web cut, 720p    (phones)
#   ../public/video/the-lineage-poster.webp / -poster-mobile.webp   cover frame (Haldighati, 20.7 s)
set -e
P=out/bsah-lineage-1080p-picture.mp4
M=out/lineage-mix.m4a
W=../public/video
ffmpeg -v error -y -i $P -i $M -map 0:v -map 1:a -c:v copy -c:a copy -shortest -movflags +faststart out/bsah-lineage-1080p.mp4
ffmpeg -v error -y -i $P -i $M -map 0:v -map 1:a -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -profile:v high \
  -c:a aac -b:a 128k -shortest -movflags +faststart $W/the-lineage.mp4
ffmpeg -v error -y -i $P -i $M -map 0:v -map 1:a -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p \
  -profile:v high -c:a aac -b:a 96k -shortest -movflags +faststart $W/the-lineage-mobile.mp4
ffmpeg -v error -y -ss 20.7 -i $P -frames:v 1 -vf scale=1280:720:flags=lanczos -c:v libwebp -quality 78 $W/the-lineage-poster.webp
ffmpeg -v error -y -ss 20.7 -i $P -frames:v 1 -vf scale=960:540:flags=lanczos -c:v libwebp -quality 76 $W/the-lineage-poster-mobile.webp
ls -la out/bsah-lineage-1080p.mp4 $W/the-lineage*
