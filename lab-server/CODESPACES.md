# Lab 환경을 GitHub Codespaces로 쓰기

Codespaces를 쓰면 **EC2/도메인 없이** 브라우저에서 랩 환경(터미널 + Docker)을 쓸 수 있습니다.

---

## 1. Codespaces가 뭔지

- **GitHub Codespaces** = GitHub 리포를 클라우드 개발 환경으로 여는 기능.
- "Open in Codespaces" 클릭 → GitHub이 리눅스 VM 하나 띄우고, 그 안에 리포 클론 + 터미널 + VS Code 웹 UI 제공.
- Docker도 사용 가능 (Docker-in-Docker 또는 사전 설치된 이미지).
- **비용:** 퍼블릭 리포는 월 무료 시간 있음. [요금](https://github.com/pricing#codespaces)

---

## 2. 사용자 입장에서 쓰는 방법

1. **Lab 페이지**에서 **"Codespaces에서 열기"** 버튼 클릭.
2. GitHub 로그인 후 **Create codespace** (기본 머신으로 생성).
   - **처음 생성 시 2~5분** 걸릴 수 있음 (VM + 이미지 + npm ci). 기다리면 됨.
   - 같은 Codespace를 **Resume** 하면 더 빨리 열림.
3. Codespace가 뜨면 터미널에서 아래 **"Codespace 터미널에서 실행할 명령어"** 블록을 복사한 뒤, `YOUR_API_KEY`, `YOUR_APP_KEY` 만 본인 값으로 바꿔서 실행.
4. 이후 챌린지 진행하면 됨.

---

### Codespace 터미널에서 실행할 명령어 (복사용)

**1) .env.local 만들기 + npm run up:full**  
아래에서 `YOUR_API_KEY`, `YOUR_APP_KEY` 를 Lab 페이지에서 입력한 값으로 바꾼 뒤 터미널에 붙여넣기.

```bash
echo 'DATADOG_API_KEY=YOUR_API_KEY' > .env.local && echo 'DATADOG_APP_KEY=YOUR_APP_KEY' >> .env.local && npm run up:full
```

**2) 한 줄씩 실행하고 싶을 때:**

```bash
echo 'DATADOG_API_KEY=YOUR_API_KEY' > .env.local
echo 'DATADOG_APP_KEY=YOUR_APP_KEY' >> .env.local
npm run up:full
```

실제 예시 (키는 본인 것으로 교체):

```bash
echo 'DATADOG_API_KEY=abc123...' > .env.local && echo 'DATADOG_APP_KEY=xyz789...' >> .env.local && npm run up:full
```

---

## 3. 리포 쪽 설정 (fixitfaster-agent에 .devcontainer 추가)

**fixitfaster-agent** 리포에 개발 환경 정의를 넣어두면, Codespaces가 그 설정으로 컨테이너를 띄웁니다.

### 3-1. fixitfaster-agent 루트에 폴더/파일 생성

**옵션 A – 스크립트 실행 (fixitfaster 폴더 기준):**

```bash
cd /Users/victor.lee/fixitfaster/lab-server
chmod +x setup-codespaces-devcontainer.sh
./setup-codespaces-devcontainer.sh
```

같은 상위 폴더에 `fixitfaster-agent` 가 없으면 먼저 클론:

```bash
cd /Users/victor.lee
git clone https://github.com/CrystalBellSound/fixitfaster-agent.git
./fixitfaster/lab-server/setup-codespaces-devcontainer.sh
```

**옵션 B – 수동 복사:** 이 리포의 `lab-server/devcontainer-example/` 내용을 **fixitfaster-agent** 리포 루트에 `.devcontainer/` 로 복사합니다.

```bash
# fixitfaster-agent 클론 후
mkdir -p fixitfaster-agent/.devcontainer
cp fixitfaster/lab-server/devcontainer-example/devcontainer.json fixitfaster-agent/.devcontainer/
```

**옵션 B – 직접 생성:** `fixitfaster-agent/.devcontainer/` 폴더를 만들고 아래 내용으로 파일을 만듭니다.

**파일 1:** `.devcontainer/devcontainer.json`

```json
{
  "name": "Fix It Faster Lab",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "postCreateCommand": "npm ci",
  "customizations": {
    "vscode": {
      "extensions": []
    }
  },
  "forwardPorts": [8126, 8125]
}
```

- `docker-in-docker`: Docker 사용 가능 (npm run up:full 등).
- `postCreateCommand`: Codespace 생성 후 `npm ci` 로 의존성 설치.
- `forwardPorts`: APM/StatsD 포트 노출 (필요 시).

**파일 2 (선택):** `.devcontainer/Dockerfile`  
이미지로 충분하면 생략. 더 꾸미고 싶을 때만 사용.

### 3-2. fixitfaster-agent에 커밋 & 푸시

```bash
cd fixitfaster-agent
git add .devcontainer/
git commit -m "Add devcontainer for Codespaces"
git push
```

이후 `https://codespaces.new/OWNER/fixitfaster-agent` 로 열면 이 환경으로 뜹니다.

---

## 4. Lab 페이지에 "Codespaces에서 열기" 버튼

fixitfaster(웹앱) Lab 페이지에 버튼/링크를 넣으면 됩니다.

- **링크 주소:** `https://codespaces.new/CrystalBellSound/fixitfaster-agent`  
  (리포가 다른 org/user면 `OWNER/REPO` 만 바꾸면 됨.)
- **버튼 위치:** API/App Key 폼 위나 아래, 또는 "명령어 보기"와 함께.

사용자 흐름: Lab 들어감 → API/App Key 입력(또는 나중에 Codespace 안에서 입력) → "Codespaces에서 열기" 클릭 → GitHub에서 Codespace 생성 → 터미널에서 `.env.local` 만들고 `npm run up:full`.

---

## 5. 정리

| 할 일 | 담당 |
|--------|------|
| fixitfaster-agent에 `.devcontainer/` 추가 | 리포 관리자 |
| Lab 페이지에 Codespaces 링크/버튼 추가 | fixitfaster 웹앱 |
| Codespace 열고 `.env.local` + `npm run up:full` | 사용자 |

이렇게 하면 EC2/도메인/HTTPS 없이도 랩 환경을 "자동으로" 띄우는 것처럼 쓸 수 있습니다.

---

## 6. 채점에 config/diff 반영 (Artifacts)

Codespace에서 수정한 **config, docker-compose, git diff** 를 채점 시 함께 보내면, AI가 실제 변경 내용을 참고해 점수를 줍니다.

### 6-1. 흐름

1. Codespace에서 챌린지 작업 (config 수정 등).
2. **제출 전에** 터미널에서 아래 **artifacts 전송 스크립트** 실행 (한 번만).
3. 그 다음 **챌린지 페이지**에서 평소처럼 답(원인/해결) 입력 후 제출.
4. 같은 `participantName` + `challengeId` 로 보낸 artifacts가 채점 시 자동으로 붙어서 반영됨.

### 6-2. Artifacts 전송 (Codespace 터미널에서)

**환경 변수**를 본인 값으로 바꾼 뒤 실행합니다.

- `FIXITFASTER_URL`: fixitfaster 웹 주소 (예: `https://dd-tse-fix-it-faster.vercel.app`)
- `CHALLENGE_ID`: 챌린지 ID (예: `apm`, `infra`, `custom-metrics`, `correlation`, `log-timezone`, `autodiscovery`, `metrics-monitor`)
- `PARTICIPANT_NAME`: 제출 시 쓸 **동일한** 이름 (영문/한글 모두 가능)

**방법 A – fixitfaster 리포에 있는 스크립트 실행 (Codespace가 fixitfaster-agent 인 경우)**

Codespace는 fixitfaster-agent 리포이므로, 스크립트를 먼저 가져와야 합니다. 한 줄로 받아서 실행:

```bash
curl -sL "https://raw.githubusercontent.com/victorjmlee/fixitfaster/main/lab-server/scripts/collect-and-send-artifacts.sh" -o /tmp/send-artifacts.sh
FIXITFASTER_URL="https://dd-tse-fix-it-faster.vercel.app" CHALLENGE_ID="apm" PARTICIPANT_NAME="MyName" bash /tmp/send-artifacts.sh
```

(위 `FIXITFASTER_URL`, `CHALLENGE_ID`, `PARTICIPANT_NAME` 만 본인 값으로 바꿔서 실행.)

**방법 B – fixitfaster-agent 에 스크립트를 두고 실행**

fixitfaster-agent 리포에 `scripts/collect-and-send-artifacts.sh` 를 복사해 두었다면:

```bash
export FIXITFASTER_URL="https://dd-tse-fix-it-faster.vercel.app"
export CHALLENGE_ID="apm"
export PARTICIPANT_NAME="MyName"
bash scripts/collect-and-send-artifacts.sh
```

스크립트는 **git status**, **git diff**(.env.local 제외), **docker-compose.yml**, **conf.d/*.yaml** 내용을 수집해 `POST /api/artifacts` 로 보냅니다. **2시간 이내**에 같은 이름으로 챌린지 제출하면 채점에 사용됩니다.
