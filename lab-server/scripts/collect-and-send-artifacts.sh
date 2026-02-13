#!/usr/bin/env bash
# Codespace(fixitfaster-agent) 터미널에서 실행.
# config/diff 를 수집해 fixitfaster API로 보냄. 제출 시 채점에 반영됨.
#
# 사용법:
#   export FIXITFASTER_URL="https://your-app.vercel.app"
#   export CHALLENGE_ID="scenario-apm"   # 현재 챌린지 ID
#   # PARTICIPANT_NAME 생략 시 ~/.fixitfaster-participant 에 저장된 값 사용 (최초 설정 시 저장)
#   bash collect-and-send-artifacts.sh
#
# 한 줄 예:
#   FIXITFASTER_URL="https://..." CHALLENGE_ID="scenario-apm" bash collect-and-send-artifacts.sh

set -e
# 참가자 이름: 환경변수 없으면 최초 설정 시 저장한 ~/.fixitfaster-participant 사용
if [ -z "$PARTICIPANT_NAME" ] && [ -f "$HOME/.fixitfaster-participant" ]; then
  PARTICIPANT_NAME=$(head -1 "$HOME/.fixitfaster-participant" | tr -d '\n\r')
fi
if [ -z "$FIXITFASTER_URL" ] || [ -z "$CHALLENGE_ID" ] || [ -z "$PARTICIPANT_NAME" ]; then
  echo "Usage: FIXITFASTER_URL=... CHALLENGE_ID=... [PARTICIPANT_NAME=...] $0"
  echo "  PARTICIPANT_NAME can be omitted if set at first run (~/.fixitfaster-participant)."
  echo "Example: FIXITFASTER_URL=https://dd-tse-fix-it-faster.vercel.app CHALLENGE_ID=scenario-apm $0"
  exit 1
fi

OUT=$(mktemp)
trap "rm -f $OUT" EXIT

echo "=== git status ===" >> "$OUT"
git status --short 2>/dev/null || true >> "$OUT"
echo "" >> "$OUT"

echo "=== git diff (excluding .env.local, staged + unstaged) ===" >> "$OUT"
git diff HEAD -- . ':(exclude).env.local' 2>/dev/null >> "$OUT" || true
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
