#!/bin/bash
# Auto-start Metro for debug builds if it isn't already running.
# Wired up as an Xcode "Start Metro" Run Script build phase so debug
# builds no longer require manually running `npm start` first.
# Release builds bundle JS into the app, so this is a no-op there.

export RCT_METRO_PORT="${RCT_METRO_PORT:=8081}"

if [[ "$CONFIGURATION" != *Debug* ]]; then
  exit 0
fi

# Something already listening on the Metro port -> assume it's running.
if nc -w 5 -z localhost "${RCT_METRO_PORT}" 2>/dev/null; then
  if curl -s "http://localhost:${RCT_METRO_PORT}/status" | grep -q "packager-status:running"; then
    echo "Metro already running on port ${RCT_METRO_PORT}."
    exit 0
  fi
  echo "Port ${RCT_METRO_PORT} in use but Metro is not responding correctly; leaving it alone."
  exit 0
fi

# SRCROOT is the ios/ dir during a build phase; repo root is one level up.
PROJECT_ROOT="$SRCROOT/.."
echo "Metro not running — launching it in a new Terminal window..."
osascript <<EOF
tell application "Terminal"
  do script "cd \"${PROJECT_ROOT}\" && npx react-native start"
  activate
end tell
EOF

exit 0
