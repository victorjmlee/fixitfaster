# EC2 Lab 서버에 HTTPS 붙이기 (Nginx + Let's Encrypt)

Vercel(HTTPS)에서 EC2 lab-server로 터미널 연결하려면 lab-server도 **HTTPS**로 열려 있어야 합니다.  
EC2 앞에 **Nginx**를 두고 **Let's Encrypt**로 무료 인증서를 발급받는 방법입니다.

**필수:** **도메인**이 하나 필요합니다. (예: `lab.회사도메인.com` 또는 본인 소유 서브도메인)  
Let's Encrypt는 **IP 주소**에는 인증서를 발급하지 않고 **도메인**에만 발급합니다.

---

## 0단계: 도메인 DNS 설정

1. 사용할 **서브도메인**을 정합니다. 예: `lab.fixitfaster.com`, `lab.회사도메인.com`
2. **DNS 관리**하는 곳(가비아, Route 53, Cloudflare 등)에서:
   - **A 레코드** 추가
   - **이름:** `lab` (또는 사용할 서브도메인. 전체가 `lab.도메인.com` 이면 보통 `lab`)
   - **값/대상:** EC2 **퍼블릭 IP** (예: `34.234.84.241`)
   - TTL: 300 정도
3. 저장 후 **몇 분~10분** 기다리면, `lab.도메인.com` 이 EC2 IP로 연결됩니다.
4. 확인 (본인 PC 터미널):
   ```bash
   ping lab.도메인.com
   ```
   EC2 IP가 나오면 OK.

---

## 1단계: EC2 보안 그룹에 80, 443 열기

1. AWS 콘솔 → **EC2** → **보안 그룹** → 이 인스턴스에 붙은 보안 그룹 선택
2. **인바운드 규칙 편집** → **규칙 추가**
3. 두 개 추가:
   - **HTTP**: 유형 `HTTP`, 포트 `80`, 소스 `0.0.0.0/0` (또는 내 IP)
   - **HTTPS**: 유형 `HTTPS`, 포트 `443`, 소스 `0.0.0.0/0` (또는 내 IP)
4. **규칙 저장**

(3001은 이제 외부에 안 열어도 됩니다. Nginx가 80/443만 받고 내부적으로 3001으로 넘깁니다.)

---

## 2단계: EC2에 Nginx 설치

EC2에 **SSH 접속**한 뒤:

**Amazon Linux 2023:**
```bash
sudo dnf install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

**Ubuntu:**
```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

확인:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost
```
`200` 이 나오면 Nginx가 동작 중입니다.

---

## 3단계: Certbot 설치 (Let's Encrypt)

**Amazon Linux 2023:**
```bash
sudo dnf install -y certbot python3-certbot-nginx
```

**Ubuntu:**
```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## 4단계: Nginx 설정 – 일단 HTTP만, 3001으로 프록시

인증서를 받기 전에, Nginx가 **80 포트**로 요청을 받아서 **localhost:3001**(lab-server)로 넘기도록 설정합니다.

```bash
sudo nano /etc/nginx/conf.d/lab-server.conf
```

아래 내용을 **전부** 넣습니다. `lab.도메인.com` 부분만 본인 도메인으로 바꿉니다.

```nginx
server {
    listen 80;
    server_name lab.도메인.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

저장: `Ctrl+O` → Enter → `Ctrl+X`

기본 default 설정이 80을 쓰고 있으면 충돌할 수 있으니, default 비활성화:

```bash
sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true
sudo nginx -t
sudo systemctl reload nginx
```

`nginx -t` 가 **syntax is ok** 이면 성공입니다.

---

## 5단계: Let's Encrypt 인증서 발급

**실제 도메인**이 EC2를 가리키고 있어야 합니다 (0단계 DNS 확인).

```bash
sudo certbot --nginx -d lab.도메인.com
```

- `lab.도메인.com` 을 본인 도메인으로 바꿉니다.
- 이메일 입력 (만료 알림용)
- 이용약관 동의 (Y)
- 이메일 수신 선택 (선택 사항, N 해도 됨)
- 끝나면 Certbot이 Nginx 설정을 수정해서 **443 HTTPS**가 켜집니다.

**성공 시** "Congratulations" 메시지가 나옵니다.

---

## 6단계: 동작 확인

1. 브라우저에서:
   ```
   https://lab.도메인.com
   ```
   접속해 봅니다. (주소창 자물쇠 확인)
2. 터미널에서 API 테스트:
   ```bash
   curl -X POST https://lab.도메인.com/api/session/start \
     -H "Content-Type: application/json" \
     -d '{"apiKey":"test","appKey":"test"}'
   ```
   `{"sessionId":"..."}` 가 나오면 OK.

---

## 7단계: Vercel 환경 변수 변경

1. **Vercel** 대시보드 → fixitfaster 프로젝트 → **Settings** → **Environment Variables**
2. `NEXT_PUBLIC_LAB_API_URL` 값을 다음처럼 **HTTPS + 도메인**으로 바꿉니다:
   - **기존:** `http://34.234.84.241:3001`
   - **변경:** `https://lab.도메인.com`
   - 포트는 안 써도 됩니다 (HTTPS 기본 443).
3. **Save** 후 **Redeploy** 한 번 합니다.

이제 Vercel Lab 페이지에서 "웹에서 실행"을 누르면 `https://lab.도메인.com` 으로 연결되고, mixed content 없이 터미널이 동작해야 합니다.

---

## 8단계: 인증서 자동 갱신 (선택)

Let's Encrypt 인증서는 **90일**마다 갱신해야 합니다. certbot이 자동 갱신용 타이머를 넣어 둡니다.

확인:
```bash
sudo systemctl status certbot-renew.timer
```

수동 갱신 테스트:
```bash
sudo certbot renew --dry-run
```

에러 없으면 실제 만료 시 자동으로 갱신됩니다.

---

## 요약 체크리스트

- [ ] 0. 도메인 DNS A 레코드로 EC2 IP 연결
- [ ] 1. 보안 그룹에 80, 443 열기
- [ ] 2. EC2에 Nginx 설치 및 실행
- [ ] 3. Certbot 설치
- [ ] 4. `/etc/nginx/conf.d/lab-server.conf` 에 프록시 설정 (server_name 본인 도메인으로)
- [ ] 5. `sudo certbot --nginx -d lab.도메인.com` 실행
- [ ] 6. 브라우저/curl로 https://lab.도메인.com 확인
- [ ] 7. Vercel `NEXT_PUBLIC_LAB_API_URL` = `https://lab.도메인.com` 후 재배포

---

## 도메인이 없을 때

- Let's Encrypt는 **도메인 없이**는 사용할 수 없습니다 (IP만으로는 발급 불가).
- **가능한 방법:**
  - 회사/개인 **도메인**에서 서브도메인 하나 할당 (가장 권장)
  - 무료 도메인 서비스(Freenom 등) 또는 **nip.io** 같은 서비스: `34.234.84.241.nip.io` 로 접속은 되지만, Let's Encrypt가 항상 지원하는 건 아니라서 별도 확인 필요
  - **AWS ALB + ACM**: Route 53으로 도메인 관리 중이면 ALB에 인증서 붙이고 3001로 포워딩 (설정이 더 복잡함)

실무에서는 **lab.회사도메인.com** 처럼 서브도메인 하나 쓰는 방식이 가장 간단합니다.
