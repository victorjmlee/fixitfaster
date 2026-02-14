#!/usr/bin/env bash
# Codespace에서 "아티팩트 전송 + 제출" 한 번에. 브라우저에서 제출할 필요 없음.
#
# 사용법:
#   FIXITFASTER_URL="..." CHALLENGE_ID="scenario-infra" bash /tmp/submit.sh
#   또는 경과 초를 맨 뒤에: bash /tmp/submit.sh 300  → 물어보지 않음
# ELAPSED_SECONDS env 또는 첫 번째 인자. 없으면 물어봄.

set -e
COLLECT_URL="https://raw.githubusercontent.com/victorjmlee/fixitfaster/main/lab-server/scripts/collect-and-send-artifacts.sh"

if [ -z "$PARTICIPANT_NAME" ] && [ -f "$HOME/.fixitfaster-participant" ]; then
  PARTICIPANT_NAME=$(head -1 "$HOME/.fixitfaster-participant" | tr -d '\n\r')
fi
if [ -z "$FIXITFASTER_URL" ] || [ -z "$CHALLENGE_ID" ] || [ -z "$PARTICIPANT_NAME" ]; then
  echo "Usage: FIXITFASTER_URL=... CHALLENGE_ID=... [PARTICIPANT_NAME=...] $0 [ELAPSED_SECONDS]"
  echo "  Example: FIXITFASTER_URL=... CHALLENGE_ID=scenario-infra bash /tmp/submit.sh 300"
  exit 1
fi

# 경과 초: 첫 번째 인자 → 물어보지 않음. 없으면 프롬프트.
if [ -n "$1" ]; then
  ELAPSED_SECONDS="$1"
elif [ -z "$ELAPSED_SECONDS" ]; then
  read -p "Elapsed seconds (Enter=0): " ELAPSED_SECONDS
  ELAPSED_SECONDS=${ELAPSED_SECONDS:-0}
fi
ELAPSED_SECONDS=$(printf '%d' "$ELAPSED_SECONDS" 2>/dev/null || echo "0")

# 1) 아티팩트 스크립트 받아서 실행
echo "Sending artifacts..."
curl -sL "$COLLECT_URL" -o /tmp/collect-and-send-artifacts.sh
bash /tmp/collect-and-send-artifacts.sh || exit 1

# 2) 제출
BASE_URL="${FIXITFASTER_URL%/}"
SUBMIT_PAYLOAD=$(python3 -c "
import sys, json
print(json.dumps({
  'challengeId': sys.argv[1],
  'participantName': sys.argv[2],
  'solution': '',
  'causeSummary': '',
  'steps': '',
  'elapsedSeconds': int(sys.argv[3])
}))
" "$CHALLENGE_ID" "$PARTICIPANT_NAME" "$ELAPSED_SECONDS" 2>/dev/null) || \
SUBMIT_PAYLOAD=$(node -e "
const c=process.argv[1], p=process.argv[2], e=parseInt(process.argv[3],10)||0;
console.log(JSON.stringify({challengeId:c, participantName:p, solution:'', causeSummary:'', steps:'', elapsedSeconds:e}));
" "$CHALLENGE_ID" "$PARTICIPANT_NAME" "$ELAPSED_SECONDS")

HTTP=$(curl -s -w "%{http_code}" -o /tmp/submit-response -X POST \
  "$BASE_URL/api/submit" \
  -H "Content-Type: application/json" \
  -d "$SUBMIT_PAYLOAD")

if [ "$HTTP" = "200" ]; then
  echo "Submitted as $PARTICIPANT_NAME (${ELAPSED_SECONDS}s). Leaderboard: $BASE_URL/leaderboard"
  cat /tmp/submit-response | python3 -c "import sys,json; d=json.load(sys.stdin); print('Score:', d.get('score','-'))" 2>/dev/null || true
else
  echo "Submit failed (HTTP $HTTP). Response:"
  cat /tmp/submit-response 2>/dev/null
  exit 1
fi
