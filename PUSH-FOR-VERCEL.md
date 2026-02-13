# Vercel 배포용 Push 가이드

**Vercel URL:** https://dd-tse-fix-it-faster.vercel.app/

## 1. 로컬에서 커밋 & Push

```bash
cd /Users/victor.lee/fixitfaster

# 변경 사항 모두 스테이징
git add -A

# 상태 확인 (선택)
git status

# 커밋 (한 번에)
git commit -m "Lab: Codespaces 연동, artifacts 채점 반영, EC2/HTTPS/Codespaces 문서"

# fixitfaster 리포(origin)로 push → Vercel 자동 배포
git push origin main
```

## 2. Push 후

- **Vercel**이 해당 리포에 연결돼 있으면 **자동 배포**가 시작됩니다.
- Vercel 대시보드 → Deployments 에서 빌드 완료될 때까지 확인.

## 3. 동작 확인

1. **Lab 페이지**: "GitHub Codespaces에서 열기" 링크 동작 확인.
2. **챌린지 제출**: 이름 + 솔루션 입력 후 제출 → 채점/리더보드 반영 확인.
3. **Artifacts (Codespace 사용 시)**: Codespace 터미널에서 artifacts 스크립트 실행 후, **같은 이름**으로 챌린지 제출 → 채점에 config 반영되는지 확인.
