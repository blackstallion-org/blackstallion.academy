#!/bin/zsh
# Double-click to start the dev server and open the site.
cd "$(dirname "$0")" || exit 1
if [ ! -d node_modules ]; then echo "Installing packages..."; npm install || exit 1; fi
(sleep 5; open "http://localhost:3000") &
npm run dev
