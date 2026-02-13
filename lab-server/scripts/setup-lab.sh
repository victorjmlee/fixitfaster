#!/usr/bin/env bash
# Codespace(fixitfaster-agent)에서 최초 1회 실행.
# API Key, App Key 입력받아 .env.local 만들고 npm run up:full 실행.
#
# 사용법:
#   export DATADOG_API_KEY=your_api_key
#   export DATADOG_APP_KEY=your_app_key
#   bash setup-lab.sh
#
# 또는 키를 입력하지 않으면 스크립트가 물어봄 (비밀문자 안 보임):
#   bash setup-lab.sh

set -e

if [ -z "$DATADOG_API_KEY" ]; then
  echo -n "Datadog API Key: "
  read -s DATADOG_API_KEY
  echo
fi
if [ -z "$DATADOG_APP_KEY" ]; then
  echo -n "Datadog App Key: "
  read -s DATADOG_APP_KEY
  echo
fi

if [ -z "$DATADOG_API_KEY" ] || [ -z "$DATADOG_APP_KEY" ]; then
  echo "API Key와 App Key가 필요합니다."
  exit 1
fi

echo "DATADOG_API_KEY=$DATADOG_API_KEY" > .env.local
echo "DATADOG_APP_KEY=$DATADOG_APP_KEY" >> .env.local
echo ".env.local created. Running npm run up:full ..."
npm run up:full
