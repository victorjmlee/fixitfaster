# Vercel에 "랩" 탭이 안 보일 때

## 원인

- 이 리포 코드에는 **Header**에 "랩" 링크가 있음 (`app/Header.tsx` → `/lab`).
- 배포된 사이트에 없다면 **Vercel이 다른 리포/브랜치**를 빌드하거나, **아직 최신 푸시가 반영되지 않은 것**일 수 있음.

## 해결 순서

### 1. Vercel에서 배포 소스 확인

1. **Vercel** → 프로젝트 **dd-tse-fix-it-faster** → **Settings** → **Git**.
2. **Connected Git Repository** 를 확인:
   - `victorjmlee/fixitfaster` 인지
   - `CrystalBellSound/fixitfaster` 등 다른 리포인지
3. **Production Branch** (보통 `main`) 확인.

### 2. 이 리포에서 그 리포로 push

- 연결된 리포가 **victorjmlee/fixitfaster** 이면:
  ```bash
  cd /Users/victor.lee/fixitfaster
  git push origin main
  ```
- 연결된 리포가 **CrystalBellSound/fixitfaster** 이면:
  - 해당 리포에 push 권한이 있어야 함.
  - 또는 Vercel 설정에서 **victorjmlee/fixitfaster** 로 연결을 바꾼 뒤 `git push origin main`.

### 3. 배포 다시 하기

- Push 후 자동 배포가 뜨는지 **Deployments** 탭에서 확인.
- 자동 배포가 안 뜨면 **Deployments** → **Redeploy** (Latest) 실행.

### 4. 브라우저 캐시

- 시크릿 창에서 **https://dd-tse-fix-it-faster.vercel.app** 열어서 상단에 "랩"이 있는지 다시 확인.

## 요약

| Vercel Git 연결 리포        | 할 일 |
|----------------------------|--------|
| victorjmlee/fixitfaster    | `git push origin main` 후 배포 확인 |
| CrystalBellSound/fixitfaster | 그 리포에 랩 포함된 코드 push 또는 Vercel을 victorjmlee/fixitfaster 로 변경 |
