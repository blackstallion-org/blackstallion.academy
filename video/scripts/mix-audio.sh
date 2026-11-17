#!/bin/sh
# Builds the film's soundtrack (60 s): the score plus distant horse sounds, all licence-clear (see video/README.md → Sound).
# Usage (inside video/): sh scripts/mix-audio.sh   → out/lineage-mix.m4a
set -e
A=../public/audio
mkdir -p out
ffmpeg -v error -y \
  -i audio/desert-rajasthan-folk-0-61s.mp3 \
  -i $A/interactions/walk.mp3 \
  -i $A/ambience/cavalry-gallop.mp3 \
  -i $A/interactions/horse-call.mp3 \
  -i $A/ambience/cavalry-gallop.mp3 \
  -i $A/interactions/snort.mp3 \
  -i $A/interactions/snort.mp3 \
  -filter_complex "
    [0:a]atrim=0:60,asetpts=PTS-STARTPTS,loudnorm=I=-17:TP=-2:LRA=11,afade=t=in:d=0.4,afade=t=out:st=55.5:d=4.5[score];
    [1:a]atrim=0:5.6,volume=0.30,afade=t=in:d=0.6,afade=t=out:st=4.4:d=1.2,adelay=4700|4700[walk];
    [2:a]atrim=0:7.4,volume=0.55,afade=t=in:d=0.9,afade=t=out:st=6.2:d=1.2,adelay=16300|16300[charge];
    [3:a]volume=0.38,adelay=16900|16900[call];
    [4:a]atrim=2:8,asetpts=PTS-STARTPTS,volume=0.45,afade=t=in:d=0.8,afade=t=out:st=4.8:d=1.2,adelay=24300|24300[ride];
    [5:a]volume=0.32,adelay=31600|31600[snort1];
    [6:a]volume=0.40,adelay=50200|50200[snort2];
    [score][walk][charge][call][ride][snort1][snort2]amix=inputs=7:normalize=0:duration=first,alimiter=limit=0.89,atrim=0:60[mix]" \
  -map "[mix]" -c:a aac -b:a 192k -ar 48000 out/lineage-mix.m4a
echo "out/lineage-mix.m4a"
