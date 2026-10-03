#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push

# Push to GitHub using the GITHUB_TOKEN secret
if [ -n "$GITHUB_TOKEN" ]; then
  git config user.email "replit-agent@users.noreply.github.com"
  git config user.name "Replit Agent"

  REMOTE_URL="https://${GITHUB_TOKEN}@github.com/eyeofmasona-sudo/Bullenhaus.git"

  if git remote get-url github-sync > /dev/null 2>&1; then
    git remote set-url github-sync "$REMOTE_URL"
  else
    git remote add github-sync "$REMOTE_URL"
  fi

  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  git push github-sync "${CURRENT_BRANCH}:main" --force
else
  echo "GITHUB_TOKEN is not set — skipping GitHub push"
fi
