#!/usr/bin/env bash
# Publish the frontend to GitHub Pages (HTTPS) at
#   https://erick-6.github.io/Spottern/
#
# Run from the frontend/ folder:  bash deploy-pages.sh
# One-time setup in the repo: Settings > Pages > Source: "Deploy from a branch",
# Branch: gh-pages, folder: / (root).
set -euo pipefail

REMOTE=$(git -C .. remote get-url origin)

echo "==> Building for the /Spottern/ subpath in demo mode"
# GitHub Pages serves a project repo under /<repo>/, so the asset base must match.
# Built without VITE_API_BASE so the public site runs the bundled sample analysis.
if [ -f .env ]; then mv .env .env.hidden.bak; fi
VITE_BASE=/Spottern/ VITE_API_BASE="" npm run build
if [ -f .env.hidden.bak ]; then mv .env.hidden.bak .env; fi

echo "==> Publishing dist/ to the gh-pages branch"
cd dist
touch .nojekyll                 # stop Jekyll from processing the build
git init -q
git add -A
git -c user.email=noreply@example.com -c user.name=deploy commit -qm "Deploy Spottern to GitHub Pages"
git push -f -q "$REMOTE" HEAD:gh-pages
rm -rf .git
cd ..

echo ""
echo "✅ Published. Live at: https://erick-6.github.io/Spottern/"
echo "   Pages can take a minute or two to pick up a new push."
