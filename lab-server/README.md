# Fix It Faster – Lab terminal server

Backend for the **Lab** feature: starts a session, runs `git clone` + `.env.local` + `npm run up:full` in a PTY, and streams I/O over WebSocket so the browser terminal can connect.

## Requirements

- Node.js 18+
- **git**, **Docker** (for `npm run up:full` inside the session)
- Deploy on a host that has Docker (e.g. Railway, Render, EC2). **Not suitable for Vercel** (no long-lived WebSocket + PTY).

## Setup

```bash
cd lab-server
npm install
```

Create `.env` if needed:

- `PORT` – default `3001`
- `LAB_REPO_URL` – default `https://github.com/victorjmlee/fixitfaster-agent.git`

## Run

```bash
npm start
# or
npm run dev
```

Server listens on `PORT`. Endpoints:

- `POST /api/session/start` – body `{ apiKey, appKey }` → returns `{ sessionId }`
- `WS /ws?sessionId=...` – connect with sessionId; PTY runs setup then interactive bash

## Frontend (Vercel)

In the fixitfaster app, set:

- `NEXT_PUBLIC_LAB_API_URL=https://your-lab-server.example.com`

Then **Lab** in the nav opens the form (API/App key) and, after starting a session, the in-browser terminal.

## Concurrency

Only one session should run `npm run up:full` at a time on the same host (Docker ports 8126, 8125, etc. are shared). For multiple concurrent users, run multiple lab-server instances with different ports or use per-session port mapping (not included in this MVP).

---

## EC2 배포 (회사 AWS)

회사 AWS 계정의 EC2에 lab-server를 올려서 Vercel 프론트에서 `NEXT_PUBLIC_LAB_API_URL`로 연결할 때 참고.

### 1. EC2 인스턴스

- **AMI**: Amazon Linux 2023 또는 Ubuntu 22.04
- **인스턴스**: t3.small 이상 권장 (Docker + npm run up:full 여유)
- **보안 그룹**: 인바운드에 **3001** (Lab API/WS) 열기. 출처는 Vercel 도메인 IP 또는 사내 VPN/오피스 IP로 제한하면 더 안전.

### 2. 인스턴스 접속 후 설치

```bash
# Node 20 (Amazon Linux 2023 예시)
sudo dnf install -y nodejs

# 또는 Ubuntu
# sudo apt update && sudo apt install -y nodejs npm

# Docker (npm run up:full 에 필요)
sudo dnf install -y docker  # Amazon Linux
sudo systemctl enable docker && sudo systemctl start docker
sudo usermod -aG docker $USER
# 로그아웃 후 다시 SSH 하거나: newgrp docker
```

### 3. lab-server 설치 및 실행

```bash
# 프로젝트 클론 또는 scp로 lab-server 폴더 복사
mkdir -p ~/lab-server
cd ~/lab-server

# fixitfaster repo 에서 lab-server 폴더만 가져온 경우
npm install
PORT=3001 node server.js
```

### 4. 항상 켜두기 (systemd)

`/etc/systemd/system/lab-server.service`:

```ini
[Unit]
Description=Fix It Faster Lab Server
After=network.target docker.service

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/lab-server
Environment=PORT=3001
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable lab-server
sudo systemctl start lab-server
sudo systemctl status lab-server
```

### 5. 프론트(Vercel) 설정

- Vercel 프로젝트 환경 변수에 추가:
  - `NEXT_PUBLIC_LAB_API_URL=https://<EC2-퍼블릭-IP 또는 도메인>:3001`
- EC2에 도메인을 붙이려면 Route 53 + ALB 또는 Nginx 리버스 프록시 사용. HTTPS 쓰려면 ALB/Nginx에서 SSL 처리.

### 6. 참고

- **HTTPS**: 3001을 직접 쓰면 브라우저는 보통 `ws://`만 허용. HTTPS 사이트에서 연결하려면 lab-server 앞에 **Nginx + Let’s Encrypt** 또는 **ALB + ACM**으로 HTTPS/ WSS 터널을 두는 것이 좋음.
- **동시 사용**: 한 EC2에서 여러 세션이 동시에 `npm run up:full` 하면 포트 충돌 가능. 동시 사용이 많으면 인스턴스 추가 또는 큐/풀 구성 검토.
