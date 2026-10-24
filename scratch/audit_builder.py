import os
import re
import glob

# All 25 pages
pages = sorted(glob.glob("app/**/page.tsx", recursive=True))

print(f"Total page files found: {len(pages)}")

for p in pages:
    route = "/" + p.replace("app/", "").replace("/page.tsx", "").replace("page.tsx", "")
    if route.endswith("/"): route = route[:-1]
    if route == "": route = "/"
    print(f"ROUTE: {route} | File: {p}")
