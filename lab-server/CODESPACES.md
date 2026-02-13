# Lab 환경을 GitHub Codespaces로 쓰기

Codespaces를 쓰면 **EC2/도메인 없이** 브라우저에서 랩 환경(터미널 + Docker)을 쓸 수 있습니다.

---

## Codespace 들어가면 할 일 (체크리스트)

| 순서 | 할 일 |
|------|--------|
| **1** | 터미널 열기 (Codespace 아래쪽 터미널 패널). |
| **2** | **최초 1회:** API Key, App Key, **제출할 이름** 넣고 환경 띄우기. 이름은 `~/.fixitfaster-participant`에 저장되어 artifacts 실행 시 자동 사용. |
| | **한 줄:** `echo 'DATADOG_API_KEY=본인키' > .env.local && echo 'DATADOG_APP_KEY=본인키' >> .env.local && npm run up:full` · 이름만 따로: `echo '내이름' > ~/.fixitfaster-participant` |
| | **또는 스크립트:** `curl -sL "https://raw.githubusercontent.com/victorjmlee/fixitfaster/main/lab-server/scripts/setup-lab.sh" -o /tmp/setup-lab.sh && bash /tmp/setup-lab.sh` (API Key, App Key, 이름 입력 프롬프트) |
| **3** | **Vercel 화면:** Codespace를 열면 Simple Browser가 Vercel URL로 **자동으로** 열릴 수 있음. 안 열리면 Simple Browser(지구본)에 `https://dd-tse-fix-it-faster.vercel.app` 입력. |
| **4** | **제출 전에:** 터미널에서 artifacts 전송. `CHALLENGE_ID`만 현재 챌린지로 바꿔서 실행 (이름은 2번에서 저장한 값 사용). |
| | `curl -sL "https://raw.githubusercontent.com/victorjmlee/fixitfaster/main/lab-server/scripts/collect-and-send-artifacts.sh" -o /tmp/send-artifacts.sh && FIXITFASTER_URL="https://dd-tse-fix-it-faster.vercel.app" CHALLENGE_ID="scenario-apm" bash /tmp/send-artifacts.sh` |
| **5** | Vercel 챌린지 페이지에서 **같은 이름**으로 원인/해결 입력 후 제출. |

**요약:** 1) 터미널에서 키 넣고 `npm run up:full` → 2) Vercel에서 챌린지 풀기 → 3) 제출 **전에** artifacts 스크립트 실행 → 4) 같은 이름으로 제출.

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
3. Codespace가 뜨면 **Simple Browser**가 Vercel URL로 자동으로 열리도록 되어 있습니다. **README만 보이고 Simple Browser가 안 열리면** 아래 "Simple Browser가 안 열릴 때" 참고.
4. 터미널에서 아래 **"Codespace 터미널에서 실행할 명령어"** 블록을 복사한 뒤, API Key·App Key·이름을 넣어 실행.
5. 이후 챌린지 진행하면 됨.

---

### Simple Browser가 안 열릴 때 (README만 보일 때)

1. **자동 작업 허용:** `Cmd+Shift+P`(Mac) / `Ctrl+Shift+P`(Win) → **"Tasks: Manage Automatic Tasks in Folder"** 입력 후 선택 → **"Allow Automatic Tasks in Folder"** 선택.
2. **창 다시 로드:** `Cmd+Shift+P` → **"Developer: Reload Window"** 실행. 다시 열리면 폴더 열 때 Simple Browser가 뜨도록 설정된 태스크가 실행될 수 있음.
3. **수동으로 열기:** `Cmd+Shift+P` → **"Tasks: Run Task"** → **"Open Fix It Faster (Vercel) in Simple Browser"** 선택. 또는 **"Simple Browser: Show"** 선택 후 URL에 `https://dd-tse-fix-it-faster.vercel.app` 입력.

fixitfaster-agent 리포에 `.vscode/tasks.json`이 있어야 위 태스크가 보입니다. 없으면 fixitfaster 쪽 설정 스크립트를 다시 실행해 `.devcontainer`와 `.vscode`를 복사한 뒤 fixitfaster-agent에서 커밋·푸시하고 Codespace를 **리빌드**하세요.

---

### Codespace 터미널에서 실행할 명령어 (복사용)

**API/App Key는 Codespace 생성 시점에 우리가 알 수 없어서, “미리” 자동 수행은 불가능합니다.**  
대신 **한 번만** 아래 중 하나를 실행하면 됩니다.

**방법 A – 한 줄로 (키 직접 넣기)**  
`YOUR_API_KEY`, `YOUR_APP_KEY` 를 본인 값으로 바꾼 뒤 붙여넣기.

```bash
echo 'DATADOG_API_KEY=YOUR_API_KEY' > .env.local && echo 'DATADOG_APP_KEY=YOUR_APP_KEY' >> .env.local && npm run up:full
```

**방법 B – 설정 스크립트 (키 입력 프롬프트)**  
fixitfaster-agent에 `scripts/setup-lab.sh` 가 있으면, 한 번만 실행해서 키 입력 후 자동으로 .env.local + npm run up:full 실행.

```bash
curl -sL "https://raw.githubusercontent.com/victorjmlee/fixitfaster/main/lab-server/scripts/setup-lab.sh" -o /tmp/setup-lab.sh && bash /tmp/setup-lab.sh
```

(스크립트가 API Key / App Key를 물어보면 입력 후 엔터. 비밀문자는 화면에 안 보임.)

**방법 C – 한 줄씩 실행**

```bash
echo 'DATADOG_API_KEY=YOUR_API_KEY' > .env.local
echo 'DATADOG_APP_KEY=YOUR_APP_KEY' >> .env.local
npm run up:full
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

**옵션 B – 수동 복사:** 이 리포의 `lab-server/devcontainer-example/` 내용을 **fixitfaster-agent** 리포에 복사합니다. `.vscode/tasks.json`까지 넣어야 Simple Browser 자동 열기가 동작합니다.

```bash
# fixitfaster-agent 클론 후
mkdir -p fixitfaster-agent/.devcontainer fixitfaster-agent/.vscode
cp fixitfaster/lab-server/devcontainer-example/devcontainer.json fixitfaster-agent/.devcontainer/
cp fixitfaster/lab-server/devcontainer-example/setup-simple-browser-task.sh fixitfaster-agent/.devcontainer/
cp fixitfaster/lab-server/devcontainer-example/tasks.json.template fixitfaster-agent/.devcontainer/
cp fixitfaster/lab-server/devcontainer-example/tasks.json.template fixitfaster-agent/.vscode/tasks.json
chmod +x fixitfaster-agent/.devcontainer/setup-simple-browser-task.sh
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

이후 `https://codespaces.new/OWNER/fixitfaster-agent` 로 열면 이 환경으로 뜹니다. **Codespace를 열 때 Simple Browser가 Vercel URL로 자동 열리도록** `.devcontainer`에 태스크가 포함되어 있습니다(최초 한 번 "자동 작업 허용" 선택 시).

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
FIXITFASTER_URL="https://dd-tse-fix-it-faster.vercel.app" CHALLENGE_ID="scenario-apm" bash /tmp/send-artifacts.sh
```

(`CHALLENGE_ID`만 현재 챌린지로 바꿔서 실행. 참가자 이름은 최초 설정 시 `~/.fixitfaster-participant`에 저장된 값을 사용.)

**방법 B – fixitfaster-agent 에 스크립트를 두고 실행**

fixitfaster-agent 리포에 `scripts/collect-and-send-artifacts.sh` 를 복사해 두었다면:

```bash
export FIXITFASTER_URL="https://dd-tse-fix-it-faster.vercel.app"
export CHALLENGE_ID="scenario-apm"
# PARTICIPANT_NAME 생략 시 ~/.fixitfaster-participant 값 사용
bash scripts/collect-and-send-artifacts.sh
```

스크립트는 **git status**, **git diff**(.env.local 제외), **docker-compose.yml**, **conf.d/*.yaml** 내용을 수집해 `POST /api/artifacts` 로 보냅니다. **2시간 이내**에 같은 이름으로 챌린지 제출하면 채점에 사용됩니다.
