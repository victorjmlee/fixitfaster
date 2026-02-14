# Fix It Faster

Datadog 트러블슈팅 챌린지와 리더보드 앱입니다. 참가자는 Codespace(랩)에서 문제를 해결한 뒤 **터미널에서 한 번에 제출**합니다. 동점일 때는 **총 소요 시간**으로 순위가 갈립니다.

---

## 참가자용: 어떻게 플레이하나요?

### 1. 랩 환경에서 챌린지 풀기

- **GitHub Codespaces** 또는 별도 랩(EC2 등)에서 `fixitfaster-agent` 리포를 사용합니다.
- 챌린지 페이지(예: Vercel에 배포된 URL)에서 시나리오를 고르고 타이머를 시작한 뒤, 랩에서 원인을 찾고 수정합니다.
- 랩 설정·상세 절차는 랩 문서를 참고하세요.

### 2. 제출 (Codespace 권장: 터미널 한 번에)

**Codespace에서는 아래 한 줄이면** 아티팩트 전송 + 제출까지 끝납니다. 브라우저에서 제출할 필요 없습니다.

```bash
curl -sL "https://raw.githubusercontent.com/victorjmlee/fixitfaster/main/lab-server/scripts/submit-from-codespace.sh" -o /tmp/submit.sh
FIXITFASTER_URL="https://여기에-배포된-앱-URL" CHALLENGE_ID="scenario-infra" ELAPSED_SECONDS=300 bash /tmp/submit.sh
```

- `CHALLENGE_ID`: 지금 푼 챌린지 (예: `scenario-infra`, `scenario-apm`)
- `ELAPSED_SECONDS`: 걸린 초. 생략하면 스크립트가 물어봅니다.
- 참가자 이름은 `~/.fixitfaster-participant`에서 자동으로 읽습니다.

끝나면 리더보드 URL을 알려 주니, 브라우저에서 확인하면 됩니다.

---

## 채점·점수 안내

- **결과(artifact) 점수**  
  시나리오마다 다릅니다. 결과만 제출해도 아래 점수까지 받을 수 있습니다.

  | 시나리오 | 결과 점수 | 만점 (결과 + 솔루션 20점) |
  |----------|-----------|----------------------------|
  | Infra (Hostname) | 50 | 70 |
  | Autodiscovery | 60 | 80 |
  | APM | 80 | 100 |
  | Correlation | 50 | 70 |
  | Custom metrics | 80 | 100 |
  | Log timezone | 70 | 90 |

- **솔루션(선택)**  
  원인/해결을 작성하면 AI가 0~20점으로 채점합니다. 비우면 0점입니다.

- **총점**  
  `결과 점수 + 솔루션 점수` (최대 100점). 동점이면 **총 소요 시간이 짧은 사람**이 위로 올라갑니다.

각 챌린지 페이지 상단에 해당 시나리오의 「결과 ○점 + 솔루션 20점 = 만점 ○점」 안내가 표시됩니다.

---

# Fix It Faster (English)

Datadog troubleshooting challenges and leaderboard app. You solve in the lab and **submit from the terminal in one step**. Ties are broken by **total time** (faster wins).

---

## For participants: How do I play?

### 1. Solve the challenge in the lab

- Use the **fixitfaster-agent** repo in **GitHub Codespaces** or your own lab (e.g. EC2).
- On the challenge page (e.g. the Vercel URL), pick a scenario, start the timer, then find and fix the issue in the lab.
- See lab docs for setup and steps.

### 2. Submit (Codespace: one command in terminal)

**In Codespace, one command** sends artifacts and submits. No need to open the browser to submit:

```bash
curl -sL "https://raw.githubusercontent.com/victorjmlee/fixitfaster/main/lab-server/scripts/submit-from-codespace.sh" -o /tmp/submit.sh
FIXITFASTER_URL="https://your-deployed-app-url" CHALLENGE_ID="scenario-infra" ELAPSED_SECONDS=300 bash /tmp/submit.sh
```

- `CHALLENGE_ID`: The challenge you just did (e.g. `scenario-infra`, `scenario-apm`)
- `ELAPSED_SECONDS`: Time taken in seconds. Omit to be prompted.
- Your name is read from `~/.fixitfaster-participant`.

Then open the leaderboard URL to see your score.


---

## Scoring

- **Result (artifact) score**  
  Depends on the scenario. Submitting only results can earn up to:

  | Scenario | Result score | Max (result + 20 solution) |
  |----------|--------------|----------------------------|
  | Infra (Hostname) | 50 | 70 |
  | Autodiscovery | 60 | 80 |
  | APM | 80 | 100 |
  | Correlation | 50 | 70 |
  | Custom metrics | 80 | 100 |
  | Log timezone | 70 | 90 |

- **Solution (optional)**  
  If you write cause and resolution, AI scores them 0–20. Empty = 0.

- **Total**  
  `Result score + Solution score` (capped at 100). Ties are ranked by **shorter total time**.

Each challenge page shows that scenario’s “Result ○ pts + Solution 20 pts = ○ max” at the top.
