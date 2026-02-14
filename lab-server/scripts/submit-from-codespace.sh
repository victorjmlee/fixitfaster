#!/usr/bin/env bash
# Codespace에서 "아티팩트 전송 + 제출" 한 번에. 브라우저에서 제출할 필요 없음.
#
# 사용법:
#   FIXITFASTER_URL="https://your-app.vercel.app" CHALLENGE_ID="scenario-infra" ELAPSED_SECONDS=300 bash submit-from-codespace.sh
# ELAPSED_SECONDS 생략 시 물어봄. PARTICIPANT_NAME은 ~/.fixitfaster-participant 사용.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COLLECT_SCRIPT="${SCRIPT_DIR}/collect-and-send-artifacts.sh"

if [ -z "$PARTICIPANT_NAME" ] && [ -f "$HOME/.fixitfaster-participant" ]; then
  PARTICIPANT_NAME=$(head -1 "$HOME/.fixitfaster-participant" | tr -d '\n\r')
fi
if [ -z "$FIXITFASTER_URL" ] || [ -z "$CHALLENGE_ID" ] || [ -z "$PARTICIPANT_NAME" ]; then
  echo "Usage: FIXITFASTER_URL=... CHALLENGE_ID=... [PARTICIPANT_NAME=...] [ELAPSED_SECONDS=...] $0"
  echo "  PARTICIPANT_NAME: env or ~/.fixitfaster-participant"
  echo "  ELAPSED_SECONDS: optional, will prompt if not set"
  exit 1
fi

if [ -z "$ELAPSED_SECONDS" ]; then
  read -p "Elapsed seconds (Enter=0): " ELAPSED_SECONDS
  ELAPSED_SECONDS=${ELAPSED_SECONDS:-0}
fi
ELAPSED_SECONDS=$(printf '%d' "$ELAPSED_SECONDS" 2>/dev/null || echo "0")

# 1) 아티팩트 전송
echo "Sending artifacts..."
FIXITFASTER_URL="$FIXITFASTER_URL" CHALLENGE_ID="$CHALLENGE_ID" PARTICIPANT_NAME="$PARTICIPANT_NAME" bash "$COLLECT_SCRIPT" || exit 1

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
