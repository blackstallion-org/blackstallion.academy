#!/bin/sh
# Downloads the Higgsfield placeholder stills and hero loop into public/media.
# Run it on your Mac from the project folder:  sh scripts/fetch-media.sh
# (The build sandbox can't reach Higgsfield's CDN, so this step runs on your machine.)
set -e
cd "$(dirname "$0")/../public/media"
get() { echo "→ $1"; curl -fL --retry 3 -o "$1" "$2"; }
get hero-dust.png       "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002316_a9ac0234-9080-4a64-8d92-cf0705055f6b.png"
get rearing.png         "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002317_1504aa62-05a7-47df-9bf5-fbb2b0c78ecc.png"
get gallop.png          "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002435_48940254-f4cb-49fe-9236-d84b15570955.png"
get eye.png             "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002317_26761800-94f0-40d6-a6b2-a35941ddc7e0.png"
get rider-lance.png     "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002435_480a7609-4bd8-46c6-83b4-8c740f8aaf4b.png"
get dune-silhouette.png "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002317_0f749476-7e8d-47bf-b57a-9adcb7b21741.png"
get bg-fort.png         "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002435_531c9a37-9fa8-4152-ad47-e0d3d35105a4.png"
get bg-arena.png        "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002435_e0aa5fef-e93d-4950-a155-e4c8a2883ae4.png"
get bg-stable.png       "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002640_d9a4c4d4-d61a-4660-a63c-857a874f56aa.png"
get bg-pavilion.png     "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002640_8d4143ab-a4d7-479b-86d6-aaa3edfc9947.png"
get bg-passport.png     "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002640_5e132524-4ec5-4185-8dc4-76b49caab8e4.png"
get bg-charge.png       "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002640_5b5f28cc-654a-499d-8b0e-35093d96acb5.png"
get dust-plume.png      "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002905_56886768-0acc-459c-ae40-a8356254a871.png"
get dust-wall.png       "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002905_226a4699-2319-45c7-ac8d-3d48708a5a42.png"
get hero-loop.mp4       "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/hf_20261009_002919_571f23fa-14a9-4d0b-bbe3-19f4311054d8.mp4"
echo "Done. Restart npm run dev if it's running."
