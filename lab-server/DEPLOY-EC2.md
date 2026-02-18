# Lab 서버 EC2 배포 – 단계별 가이드

아래 순서대로 하나씩 하면 됩니다.

---

## 1단계: AWS 콘솔에서 EC2 인스턴스 만들기

1. **AWS 콘솔** 로그인 → **EC2** 서비스로 이동합니다.
2. 왼쪽 메뉴에서 **인스턴스** → **인스턴스 시작** 을 누릅니다.
3. **이름**: 예) `fixitfaster-lab-server`
4. **AMI(이미지)**  
   - **Amazon Linux 2023** 또는 **Ubuntu 22.04 LTS** 중 하나 선택.
5. **인스턴스 유형**  
   - **t3.small** 이상 선택 (Docker + npm 실행 여유 있음).
6. **키 페어**  
   - "새 키 페어 생성" 선택 → 이름 입력(예: `lab-server-key`) → **다운로드**.  
   - `.pem` 파일은 잃어버리지 말고 안전한 곳에 보관 (SSH 접속에 필요).
7. **네트워크 설정**  
   - "편집" 클릭 후:
     - **보안 그룹** 새로 만들기 또는 기존 것 선택.
     - 인바운드 규칙 추가:
       - **SSH**: 유형 SSH, 포트 22, 소스 "내 IP" 또는 회사 IP.
       - **Lab 서버**: 유형 "사용자 지정 TCP", 포트 **3001**, 소스 "내 IP" 또는 "0.0.0.0/0"(테스트용, 나중에 제한 가능).
8. **스토리지**  
   - 기본 8GB 그대로 두거나 20GB 정도로 늘려도 됩니다.
9. **인스턴스 시작** 버튼으로 생성합니다.

**결과**: 인스턴스 목록에 새 인스턴스가 보이고, 상태가 "실행 중"이 되면 다음 단계로 갑니다.

---

## 2단계: EC2에 SSH로 접속하기

1. EC2 콘솔에서 방금 만든 **인스턴스**를 클릭합니다.
2. 상단 **연결** 버튼을 누릅니다.
3. "SSH 클라이언트" 탭에 나오는 예시 명령을 복사합니다.  
   형태는 대략 다음과 같습니다:
   ```bash
   ssh -i "lab-server-key.pem" ec2-user@ec2-xx-xx-xx-xx.compute-1.amazonaws.com
   ```
4. **터미널**을 열고, `.pem` 파일이 있는 폴더로 이동한 뒤:
   ```bash
   chmod 400 lab-server-key.pem
   ssh -i "lab-server-key.pem" ec2-user@<여기에-퍼블릭-IP또는-도메인>
   ```
   - Amazon Linux면 사용자 이름은 보통 `ec2-user`, Ubuntu면 `ubuntu`입니다.
5. "Are you sure you want to continue connecting?" 나오면 `yes` 입력 후 엔터.

**결과**: 프롬프트가 `ec2-user@ip-xxx-xxx-xxx` 처럼 바뀌면 EC2 안에 들어온 것입니다.

---

## 3단계: Node.js 설치하기

**Amazon Linux 2023** 인 경우:

```bash
sudo dnf install -y nodejs
```

**Ubuntu** 인 경우:

```bash
sudo apt update
sudo apt install -y nodejs npm
```

설치 확인:

```bash
node -v
npm -v
```

**결과**: `v20.x.x` 같은 버전이 나오면 됩니다.

---

## 4단계: Docker 설치하기 (하나씩 따라 하기)

Lab에서 `npm run up:full` 할 때 Docker가 필요합니다. **EC2 SSH 접속한 터미널**에서 진행합니다.

### 4-1. Docker 설치

**Amazon Linux 2023** 인 경우, 아래를 **한 줄씩** 실행합니다:

```bash
sudo dnf install -y docker
```

- 끝날 때까지 기다립니다. `Complete!` 비슷한 메시지가 나오면 다음으로.

```bash
sudo systemctl enable docker
```

- 출력: `Created symlink ...` 정도만 나오면 OK.

```bash
sudo systemctl start docker
```

- 출력 없거나 "Job for docker.service has finished" 비슷하면 OK.

**Ubuntu** 인 경우:

```bash
sudo apt update
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
```

### 4-2. 현재 사용자를 docker 그룹에 넣기

Docker를 sudo 없이 쓰려면, 지금 로그인한 사용자(`ec2-user` 또는 `ubuntu`)를 `docker` 그룹에 넣어야 합니다.

```bash
sudo usermod -aG docker $USER
```

- `$USER` 는 지금 사용자 이름(보통 ec2-user 또는 ubuntu)으로 자동 치환됩니다. 출력은 없을 수 있습니다.

### 4-3. 그룹 적용을 위해 로그아웃 후 다시 접속

`usermod` 는 **다음 로그인**부터 적용됩니다. 그래서:

1. EC2 SSH 세션에서 **로그아웃**합니다:
   ```bash
   exit
   ```
2. 로컬 터미널로 돌아온 뒤, **다시 SSH 접속**합니다:
   ```bash
   ssh -i "jongmin-ec2.pem" ec2-user@34.234.84.241
   ```
   (키 경로와 IP는 본인 환경에 맞게 바꿉니다.)

**또는** 로그아웃 없이 이 세션에서만 적용하려면:

```bash
newgrp docker
```

- 프롬프트가 다시 나오면 같은 셸에서 docker 그룹이 적용된 상태입니다. 이 경우 4-4만 바로 진행하면 됩니다.

### 4-4. Docker 동작 확인

다시 접속한 뒤(또는 `newgrp docker` 후) 아래를 실행합니다:

```bash
docker run hello-world
```

- 처음이면 이미지 다운로드 후, 마지막에 **"Hello from Docker!"** 메시지가 나오면 성공입니다.
- `permission denied` 나오면: 로그아웃 후 다시 SSH 접속했는지 확인하고, `groups` 입력해서 `docker`가 포함돼 있는지 봅니다.

---

## 5단계: Git 설치하기 (없을 경우)

lab-server 코드를 **클론**으로 가져올 때만 필요합니다. **SCP로 복사**할 거면 이 단계는 건너뛰어도 됩니다.

**Amazon Linux 2023**:

```bash
sudo dnf install -y git
```

**Ubuntu**:

```bash
sudo apt install -y git
```

설치 확인:

```bash
git --version
```

- `git version 2.x.x` 가 나오면 됩니다.

---

## 6단계: lab-server 코드 가져오기 (두 방법 중 하나만)

### 방법 A – EC2에서 직접 클론 (Git 필요)

**EC2 SSH 터미널**에서:

```bash
cd ~
```

- 홈 디렉터리로 이동합니다.

```bash
git clone https://github.com/victorjmlee/fixitfaster.git
```

- 저장소가 `~/fixitfaster` 로 내려받아집니다. 끝날 때까지 기다립니다.

```bash
cd fixitfaster/lab-server
```

- lab-server 폴더로 들어갑니다. `ls` 치면 `server.js`, `package.json` 등이 보여야 합니다.

**여기까지 하면 7단계로 가면 됩니다.** (7단계에서 경로만 `~/fixitfaster/lab-server` 로 쓰면 됩니다.)

---

### 방법 B – 내 PC에서 SCP로 lab-server 폴더만 복사

**중요: 아래 명령은 EC2가 아니라 “내 컴퓨터” 터미널**에서 실행합니다. (새 터미널 창을 열고, EC2 SSH는 끊어도 됩니다.)

1. **내 PC**에서 터미널을 열고, `.pem` 키가 있는 폴더로 이동합니다. 예:
   ```bash
   cd ~/Downloads
   ```
2. EC2 퍼블릭 IP를 확인합니다 (예: `34.234.84.241`).
3. 아래 명령에서 **세 곳**을 본인에 맞게 바꿉니다:
   - `jongmin-ec2.pem` → 본인 키 파일 이름
   - `34.234.84.241` → 본인 EC2 퍼블릭 IP
   - `/Users/victor.lee/fixitfaster/lab-server` → 본인 PC에서 fixitfaster 프로젝트의 `lab-server` 폴더 **전체 경로**

   ```bash
   scp -i "jongmin-ec2.pem" -r /Users/victor.lee/fixitfaster/lab-server ec2-user@34.234.84.241:~/
   ```

4. 엔터 후, 처음이면 `Are you sure you want to continue connecting (yes/no)?` 나오면 `yes` 입력.
5. 파일들이 복사됩니다. 끝나면 프롬프트가 다시 나옵니다.

이제 **다시 EC2에 SSH 접속**한 뒤:

```bash
cd ~/lab-server
ls
```

- `server.js`, `package.json`, `package-lock.json` 등이 보이면 성공입니다.

---

## 7단계: lab-server 의존성 설치 및 실행 테스트 (하나씩)

**모든 명령은 EC2 SSH 접속한 터미널**에서 실행합니다.

### 7-1. lab-server 폴더로 이동

**방법 A(클론)로 했으면:**

```bash
cd ~/fixitfaster/lab-server
```

**방법 B(SCP)로 했으면:**

```bash
cd ~/lab-server
```

### 7-2. npm 패키지 설치

```bash
npm install
```

- `package.json` 기준으로 의존성 설치됩니다. 1~2분 걸릴 수 있습니다.
- 끝나면 `added X packages` 비슷한 메시지가 나옵니다. 에러 없으면 다음으로.

### 7-3. 서버 실행 (테스트)

```bash
PORT=3001 node server.js
```

- **기대하는 출력:**  
  `Lab server listening on 3001`  
  한 줄만 나오고, 그 아래로는 아무것도 안 나오고 대기하는 상태가 정상입니다.

- **에러가 나오면:**
  - `Cannot find module ...` → `npm install` 이 제대로 끝났는지 확인하고 다시 `npm install` 후 실행.
  - `EADDRINUSE: address already in use` → 3001 포트를 쓰는 게 이미 있음. `sudo lsof -i :3001` 로 확인 후 해당 프로세스 종료하거나, 다른 포트(예: `PORT=3002 node server.js`)로 테스트.

### 7-4. 테스트가 끝나면 서버 중지

현재 터미널에서 서버가 돌고 있는 상태이므로, **키보드로**:

`Ctrl + C`

- 서버가 멈추고 프롬프트가 다시 나옵니다. 이제 8단계에서 서버를 “백그라운드 서비스”로 등록합니다.

---

## 8단계: systemd 서비스로 등록 (재부팅 후에도 자동 실행, 하나씩)

서버를 매번 수동으로 `node server.js` 하지 않고, EC2가 켜지면 자동으로 lab-server가 실행되게 만듭니다.

### 8-1. 서비스 파일 만들기

```bash
sudo nano /etc/systemd/system/lab-server.service
```

- `nano` 라는 에디터가 열립니다. 빈 파일이거나 기존 내용이 있을 수 있습니다.

### 8-2. 아래 내용 전부 붙여넣기

**Amazon Linux (ec2-user)** 인 경우, 아래 블록 **전부** 복사해서 nano 안에 붙여넣습니다 (기존 내용이 있으면 전부 지우고 붙여넣어도 됩니다):

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

**중요:**

- **방법 A(클론)** 로 `~/fixitfaster/lab-server` 에 두었다면, 아래 두 줄만 수정합니다:
  - `WorkingDirectory=/home/ec2-user/lab-server`  
    → `WorkingDirectory=/home/ec2-user/fixitfaster/lab-server`
- **Ubuntu** 인 경우:
  - `User=ec2-user` → `User=ubuntu`
  - `WorkingDirectory=/home/ec2-user/lab-server` → `WorkingDirectory=/home/ubuntu/lab-server`  
    (클론이면 `/home/ubuntu/fixitfaster/lab-server`)

### 8-3. 저장하고 나가기

1. `Ctrl + O` (저장)
2. Enter (파일명 확인)
3. `Ctrl + X` (나가기)

- 다시 터미널 프롬프트로 돌아옵니다.

### 8-4. 서비스 등록 및 시작

아래를 **한 줄씩** 실행합니다:

```bash
sudo systemctl daemon-reload
```

- systemd가 새 서비스 파일을 읽습니다. 출력 없으면 정상.

```bash
sudo systemctl enable lab-server
```

- 부팅 시 자동 시작되도록 등록합니다. `Created symlink ...` 비슷하게 나오면 OK.

```bash
sudo systemctl start lab-server
```

- 지금 바로 서비스를 시작합니다. 출력 없으면 정상.

```bash
sudo systemctl status lab-server
```

- **기대하는 출력:**  
  `Active: active (running)` (초록색으로 보일 수 있음)  
  그 아래에 `Lab server listening on 3001` 이 보이면 성공입니다.

- **실패한 경우:**  
  `Active: failed` 이면:
  ```bash
  journalctl -u lab-server -n 30 --no-pager
  ```
  로 로그를 보고, `WorkingDirectory` 나 `User` 경로가 실제 경로와 같은지 확인합니다.

### 8-5. (선택) 서비스 재시작/중지 명령

나중에 코드를 수정했을 때:

- 재시작: `sudo systemctl restart lab-server`
- 중지: `sudo systemctl stop lab-server`
- 상태 확인: `sudo systemctl status lab-server`

---

## 9단계: EC2 보안 그룹에서 3001 포트 열기 (화면 기준)

브라우저나 Vercel에서 EC2의 3001 포트로 접속하려면, **방화벽(보안 그룹)** 에서 3001을 허용해야 합니다.

### 9-1. AWS 콘솔 접속

1. 브라우저에서 **AWS 콘솔** 로그인 → **EC2** 서비스로 이동합니다.
2. 왼쪽 메뉴에서 **보안 그룹(Security Groups)** 을 클릭합니다.

### 9-2. 인스턴스에 붙은 보안 그룹 찾기

1. **인스턴스(Instances)** 메뉴로 가서, 사용 중인 EC2 인스턴스를 클릭합니다.
2. 아래쪽 **보안** 탭을 클릭합니다.
3. **보안 그룹** 이름이 하나 나옵니다 (예: `launch-wizard-74`). 그 이름을 클릭하거나, **보안 그룹 ID**를 복사해 둡니다.
4. 다시 왼쪽에서 **보안 그룹** 메뉴로 가서, 방금 본 그룹을 선택합니다.

### 9-3. 인바운드 규칙 편집

1. **인바운드 규칙(Inbound rules)** 탭을 누릅니다.
2. **인바운드 규칙 편집(Edit inbound rules)** 버튼을 클릭합니다.
3. **규칙 추가(Add rule)** 를 한 번 누릅니다.
4. 새 규칙에서:
   - **유형(Type):** "사용자 지정 TCP(Custom TCP)" 를 선택합니다.
   - **포트 범위(Port range):** `3001` 입력합니다.
   - **소스(Source):**
     - 테스트용: **"어디서든(Anywhere-IPv4)"** 선택 (자동으로 `0.0.0.0/0` 로 채워짐).
     - 나중에 제한하려면 **"내 IP(My IP)"** 또는 특정 IP를 입력합니다.
5. **규칙 저장(Save rules)** 버튼을 눌러 저장합니다.

### 9-4. 확인

인바운드 규칙 목록에 **TCP 3001**, 소스 `0.0.0.0/0` (또는 지정한 IP) 가 보이면 9단계 완료입니다.

---

## 10단계: 동작 확인 (내 PC에서)

EC2가 아니라 **본인 컴퓨터**에서 아래를 합니다.

### 10-1. EC2 퍼블릭 IP 확인

- AWS 콘솔 → **EC2** → **인스턴스** → 해당 인스턴스 클릭 → **퍼블릭 IPv4 주소** 를 복사합니다 (예: `34.234.84.241`).

### 10-2. 브라우저로 접속

브라우저 주소창에:

```
http://34.234.84.241:3001
```

(IP는 본인 EC2 IP로 바꿉니다.)

- **기대:**  
  - 빈 페이지이거나 "Cannot GET /" 같은 짧은 메시지가 나와도 괜찮습니다. **연결이 되면** 3001 포트가 열린 것입니다.
- **연결 안 되면:**  
  - 9단계 보안 그룹에서 3001 포트가 추가됐는지, EC2 인스턴스가 "실행 중"인지 다시 확인합니다.

### 10-3. 터미널에서 API 테스트 (curl)

**내 PC** 터미널에서 (Mac/Linux):

```bash
curl -X POST http://34.234.84.241:3001/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"test","appKey":"test"}'
```

(IP를 본인 EC2 IP로 바꿉니다.)

- **기대하는 출력:**  
  `{"sessionId":"xxxxxxxxxxxxxxxxxxxxxxxx"}`  
  같은 JSON 한 줄이 나오면 Lab API가 정상 동작하는 것입니다.

- **연결 거부(Connection refused):**  
  - EC2에서 `sudo systemctl status lab-server` 로 서비스가 실행 중인지 확인합니다.
- **타임아웃:**  
  - 보안 그룹에서 3001 인바운드가 열려 있는지 다시 확인합니다.

---

## 11단계: Vercel(프론트)에 Lab 서버 주소 넣기

1. **Vercel** 대시보드 → fixitfaster 프로젝트 선택.
2. **Settings** → **Environment Variables**.
3. 새 변수 추가:
   - **Name**: `NEXT_PUBLIC_LAB_API_URL`
   - **Value**: `http://<EC2-퍼블릭-IP>:3001`  
     (예: `http://3.38.123.45:3001`)
4. **Save** 후 **Redeploy** 한 번 해줍니다.

**결과**: Vercel 앱의 Lab 페이지에서 "웹에서 실행"을 누르면 EC2 lab-server로 연결됩니다.

---

## 12단계: (선택) HTTPS 쓰려면

- 지금은 `http://IP:3001` 이라서, Vercel(https) 페이지에서 연결 시 브라우저가 혼합 콘텐츠로 막을 수 있습니다.
- **HTTPS**를 쓰려면:
  - EC2 앞에 **Nginx** 설치 후 **Let’s Encrypt** 로 SSL 발급,  
    또는
  - **ALB(Application Load Balancer)** + **ACM** 으로 인증서 붙이고 3001으로 포워딩  
  하면 됩니다. (상세는 별도 설정이 필요합니다.)

---

## 요약 체크리스트

- [ ] 1. EC2 인스턴스 생성 (Amazon Linux 또는 Ubuntu, t3.small 이상)
- [ ] 2. SSH로 접속
- [ ] 3. Node.js 설치
- [ ] 4. Docker 설치 및 그룹 적용
- [ ] 5. Git 설치
- [ ] 6. lab-server 코드 가져오기 (클론 또는 scp)
- [ ] 7. `npm install` 후 `PORT=3001 node server.js` 로 테스트
- [ ] 8. systemd 서비스 등록 및 시작
- [ ] 9. 보안 그룹에서 3001 포트 열기
- [ ] 10. curl 또는 브라우저로 동작 확인
- [ ] 11. Vercel에 `NEXT_PUBLIC_LAB_API_URL` 설정 후 재배포

여기까지 하면 회사 AWS EC2에 lab-server가 배포된 상태입니다.
