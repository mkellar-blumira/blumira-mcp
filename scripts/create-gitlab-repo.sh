#!/usr/bin/env bash
# Creates the mkellar/blumira-mcp repository on GitLab and pushes the code.
#
# Usage:
#   GITLAB_PAT="glpat-your-personal-access-token" bash scripts/create-gitlab-repo.sh
#
# Requirements:
#   - A GitLab personal access token with 'api' scope (not a project token)
#   - git configured with push access

set -euo pipefail

: "${GITLAB_PAT:?Set GITLAB_PAT to a personal access token with api scope}"

echo "Creating mkellar/blumira-mcp on GitLab..."

RESPONSE=$(curl -s --fail-with-body \
  --header "PRIVATE-TOKEN: $GITLAB_PAT" \
  --header "Content-Type: application/json" \
  --data '{
    "name": "blumira-mcp",
    "path": "blumira-mcp",
    "description": "MCP (Model Context Protocol) server for the Blumira Public API",
    "visibility": "private",
    "initialize_with_readme": false
  }' \
  "https://gitlab.com/api/v4/projects")

HTTP_URL=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['http_url_to_repo'])")
echo "Repository created: $HTTP_URL"

echo "Pushing code..."
cd "$(dirname "$0")/.."

git remote add blumira-mcp "https://oauth2:${GITLAB_PAT}@gitlab.com/mkellar/blumira-mcp.git" 2>/dev/null || \
  git remote set-url blumira-mcp "https://oauth2:${GITLAB_PAT}@gitlab.com/mkellar/blumira-mcp.git"

git push blumira-mcp HEAD:main

echo ""
echo "Done! Repository is live at: https://gitlab.com/mkellar/blumira-mcp"
