#!/usr/bin/env bash
# Codespace(fixitfaster-agent) 터미널에서 실행.
# config/diff 를 수집해 fixitfaster API로 보냄. 제출 시 채점에 반영됨.
#
# 사용법:
#   export FIXITFASTER_URL="https://your-app.vercel.app"
#   export CHALLENGE_ID="apm"   # 챌린지 ID (예: apm, custom-metrics, infra)
#   export PARTICIPANT_NAME="홍길동"
#   bash collect-and-send-artifacts.sh
#
# 또는 한 줄로:
#   FIXITFASTER_URL="https://..." CHALLENGE_ID="apm" PARTICIPANT_NAME="홍길동" bash collect-and-send-artifacts.sh

set -e
if [ -z "$FIXITFASTER_URL" ] || [ -z "$CHALLENGE_ID" ] || [ -z "$PARTICIPANT_NAME" ]; then
  echo "Usage: FIXITFASTER_URL=... CHALLENGE_ID=... PARTICIPANT_NAME=... $0"
  echo "Example: FIXITFASTER_URL=https://fixitfaster.vercel.app CHALLENGE_ID=apm PARTICIPANT_NAME=MyName $0"
  exit 1
fi

OUT=$(mktemp)
trap "rm -f $OUT" EXIT

echo "=== git status ===" >> "$OUT"
git status --short 2>/dev/null || true >> "$OUT"
echo "" >> "$OUT"

echo "=== git diff (excluding .env.local) ===" >> "$OUT"
git diff -- . ':(exclude).env.local' 2>/dev/null >> "$OUT" || true
echo "" >> "$OUT"

if [ -f "docker-compose.yml" ]; then
  echo "=== docker-compose.yml ===" >> "$OUT"
  cat docker-compose.yml >> "$OUT"
  echo "" >> "$OUT"
fi

if [ -d "conf.d" ]; then
  echo "=== conf.d/ ===" >> "$OUT"
  for f in conf.d/*.yaml conf.d/*.yml; do
    [ -f "$f" ] && echo "--- $f ---" >> "$OUT" && cat "$f" >> "$OUT" && echo "" >> "$OUT"
  done
fi

ARTIFACTS=$(cat "$OUT")
# JSON 이스케이프: 줄바꿈 등
PAYLOAD=$(printf '%s' "$ARTIFACTS" | python3 -c "
import sys, json
s = sys.stdin.read()
print(json.dumps({'challengeId': sys.argv[1], 'participantName': sys.argv[2], 'artifacts': s}))
" "$CHALLENGE_ID" "$PARTICIPANT_NAME" 2>/dev/null) || {
  PAYLOAD=$(printf '%s' "$ARTIFACTS" | node -e "
const s = require('fs').readFileSync(0,'utf8');
const c=process.argv[1], p=process.argv[2];
console.log(JSON.stringify({challengeId:c, participantName:p, artifacts:s}));
" "$CHALLENGE_ID" "$PARTICIPANT_NAME")
}

HTTP_CODE=$(curl -s -w "%{http_code}" -o /tmp/artifacts-response -X POST \
  "$FIXITFASTER_URL/api/artifacts" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

if [ "$HTTP_CODE" = "200" ]; then
  echo "Artifacts sent. Submit your answer on the challenge page with the same participant name: $PARTICIPANT_NAME"
else
  echo "Failed to send artifacts (HTTP $HTTP_CODE). Check FIXITFASTER_URL and network."
  cat /tmp/artifacts-response 2>/dev/null || true
  exit 1
fi
