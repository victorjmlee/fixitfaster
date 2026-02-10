# GitHub SSH 설정 (처음부터)

## 1. 이미 키가 있는지 확인

```bash
ls -la ~/.ssh
```

`id_ed25519.pub` 또는 `id_rsa.pub` 파일이 있으면 이미 키가 있는 것. **2단계 건너뛰고 3단계**로 가서 해당 `.pub` 내용을 GitHub에 등록하면 됨.

---

## 2. 새 SSH 키 만들기

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

- **파일 위치 물어보면** Enter만 누르면 됨 (기본: `~/.ssh/id_ed25519`).
- **Passphrase** 물어보면:
  - 비워두려면 Enter 두 번 (매번 push할 때 비밀번호 안 물음)
  - 보안 강화하려면 비밀번호 입력 (push할 때 이 비밀번호 입력)

---

## 3. ssh-agent에 키 넣기

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

(`id_rsa` 썼으면 `~/.ssh/id_rsa` 로 바꾸기)

---

## 4. 공개 키를 GitHub에 등록

**4-1. 공개 키 내용 복사**

```bash
cat ~/.ssh/id_ed25519.pub
```

나온 한 줄 전체를 복사 (예: `ssh-ed25519 AAAAC3... your_email@example.com`).

**4-2. 여러 키가 있을 때 (회사/개인 분리)**  
`~/.ssh/config`에서 GitHub만 새 키를 쓰게 하려면 `IdentitiesOnly yes`를 넣어야 함. 안 넣으면 ssh-agent에 올라온 다른 키가 먼저 시도돼서 회사 계정으로 인증될 수 있음:

```
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github
  IdentitiesOnly yes
```

**4-3. GitHub 웹에서 등록**

1. [GitHub](https://github.com) 로그인
2. 우측 상단 프로필 사진 → **Settings**
3. 왼쪽 맨 아래 **Developer settings** → **Personal access tokens** 옆 **SSH and GPG keys**
4. **New SSH key** 클릭
5. **Title**: 아무거나 (예: `MacBook`, `내 컴퓨터`)
6. **Key**: 방금 복사한 `ssh-ed25519 AAAAC3...` 전체 붙여넣기
7. **Add SSH key** 클릭

---

## 5. 연결 테스트

```bash
ssh -T git@github.com
```

처음이면 `Are you sure you want to continue connecting?` → **yes** 입력.

나오는 메시지 예:

```
Hi victorjmlee! You've successfully authenticated, but GitHub does not provide shell access.
```

이렇게 나오면 성공.

---

## 6. 리모트를 SSH로 바꾸고 push

fixitfaster 리포 기준:

```bash
cd ~/fixitfaster
git remote set-url origin git@github.com:victorjmlee/fixitfaster.git
git remote -v   # origin 이 git@github.com:... 로 바뀌었는지 확인
git push -u origin main
```

이제부터 `git push` 할 때 Username/Password 안 물어봄.
