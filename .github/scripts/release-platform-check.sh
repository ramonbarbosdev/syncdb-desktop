#!/usr/bin/env bash
set -euo pipefail

PLATFORM="${1:?win, mac ou linux}"
GITHUB_OUTPUT="${GITHUB_OUTPUT:?}"

MSG="$(git log -1 --format=%B)"

if [ "${GITHUB_REF_TYPE:-branch}" = "branch" ]; then
  if ! echo "$MSG" | grep -qiE '\[(win|mac|linux)\]'; then
    echo "should_run=false" >> "$GITHUB_OUTPUT"
    exit 0
  fi
fi

if echo "$MSG" | grep -qi "\\[${PLATFORM}\\]"; then
  echo "should_run=true" >> "$GITHUB_OUTPUT"
elif echo "$MSG" | grep -qiE '\[(win|mac|linux)\]'; then
  echo "should_run=false" >> "$GITHUB_OUTPUT"
else
  echo "should_run=true" >> "$GITHUB_OUTPUT"
fi