#!/usr/bin/env bash
# fixitfaster-agent 리포에 .devcontainer 넣기 (Codespaces용)
# 사용법:
#   ./setup-codespaces-devcontainer.sh                    # 같은 폴더에 fixitfaster-agent 있으면 거기 적용
#   ./setup-codespaces-devcontainer.sh /path/to/fixitfaster-agent

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_JSON="${SCRIPT_DIR}/devcontainer-example/devcontainer.json"
AGENT_DIR="${1:-$(dirname "$SCRIPT_DIR")/../fixitfaster-agent}"

if [ ! -f "$SOURCE_JSON" ]; then
  echo "Error: $SOURCE_JSON not found."
  exit 1
fi

if [ ! -d "$AGENT_DIR" ]; then
  echo "fixitfaster-agent 폴더가 없습니다. 먼저 클론하세요:"
  echo "  git clone https://github.com/victorjmlee/fixitfaster-agent.git $AGENT_DIR"
  exit 1
fi

mkdir -p "$AGENT_DIR/.devcontainer"
mkdir -p "$AGENT_DIR/.vscode"
cp "$SOURCE_JSON" "$AGENT_DIR/.devcontainer/devcontainer.json"
cp "${SCRIPT_DIR}/devcontainer-example/setup-simple-browser-task.sh" "$AGENT_DIR/.devcontainer/"
cp "${SCRIPT_DIR}/devcontainer-example/tasks.json.template" "$AGENT_DIR/.devcontainer/"
cp "${SCRIPT_DIR}/devcontainer-example/tasks.json.template" "$AGENT_DIR/.vscode/tasks.json"
cp "${SCRIPT_DIR}/devcontainer-example/README-fixitfaster-agent.md" "$AGENT_DIR/README.md"
chmod +x "$AGENT_DIR/.devcontainer/setup-simple-browser-task.sh"
echo "Done: $AGENT_DIR/.devcontainer/ + .vscode/tasks.json + README.md"

echo ""
echo "이제 fixitfaster-agent 리포에서 커밋 & 푸시하세요:"
echo "  cd $AGENT_DIR"
echo "  git add .devcontainer/ .vscode/ README.md"
echo "  git commit -m 'Devcontainer, Simple Browser task, README=설정가이드'"
echo "  git push"
