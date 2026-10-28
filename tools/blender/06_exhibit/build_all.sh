#!/bin/sh
# Rebuilds the exhibit's models from the Marwari source: skeleton, muscles, tack, cadet, then exports both GLBs into public/models.
# usage: sh tools/blender/06_exhibit/build_all.sh [workdir]   (Blender 5.2 at /Applications/Blender.app)
set -e
B=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
D=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$D/../../.." && pwd)
W=${1:-/tmp/bsah-exhibit}
mkdir -p "$W"
"$B" -b "$ROOT/tools/blender/source/marwari_anatomy_source.blend" -P "$D/build_skeleton.py" -- "$W/skel.blend"
"$B" -b "$W/skel.blend" -P "$D/build_muscles.py" -- "$W/mus.blend"
"$B" -b "$W/mus.blend" -P "$D/build_tack.py" -- "$W/tack.blend" "$W/pose.json"
"$B" -b "$W/tack.blend" -P "$D/build_cadet.py" -- "$W/cadet.blend" "$W/pose.json"
"$B" -b "$W/cadet.blend" -P "$D/export_exhibit.py" -- "$ROOT/public/models/anatomy-exhibit.glb" "$ROOT/public/models/cadet-rider.glb" 1024
"$B" -b "$W/cadet.blend" -P "$D/validate_motion.py" -- 6 | grep MOTION
