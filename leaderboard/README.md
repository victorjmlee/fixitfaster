# Fix It Faster – Leaderboard only

Challenge list, submissions, and leaderboard only. No Datadog wiring, setup pages, or instrumentation — suitable for deploying to **EB, Vercel, etc.**

## Run locally

```bash
cd leaderboard
npm install
npm run dev
```

http://localhost:3000

## Deploy with Vercel (simplest)

1. **Sign in**  
   [vercel.com](https://vercel.com) → sign in with GitHub (or GitLab/Bitbucket).

2. **Import project**  
   - **Add New** → **Project** → select the `fixitfaster` repo.
   - Set **Root Directory** to `leaderboard` (Edit → enter `leaderboard`).
   - **Framework Preset**: Next.js (auto-detected).
   - **Build Command**: `npm run build` (default).
   - **Install Command**: `npm install` (default).
   - Click **Deploy**.

3. **After that**  
   Pushing changes under `leaderboard` will trigger automatic redeploys on Vercel.

**One-off deploy via CLI** (without linking the repo):

```bash
cd fixitfaster/leaderboard
npx vercel
```

Follow the prompts to log in; the project root will be treated as `leaderboard`.

---

## Deploy with Elastic Beanstalk

**Recommended: build locally, then deploy** (no `npm run build` on the server — faster deploys)

1. **Select environment** (once, from repo root): `cd fixitfaster && eb use <environment-name>`
2. **Deploy the leaderboard only from the leaderboard directory:**
   ```bash
   cd fixitfaster/leaderboard
   npm run deploy
   ```
   **For ap-northeast-2 (e.g. personal account):** if config `default_region` is us-east-1, set the region:
   ```bash
   AWS_REGION=ap-northeast-2 npm run deploy
   ```
   Or: `./scripts/deploy-eb.sh fixitfaster-leaderboard-victorlee ap-northeast-2`

   ⚠️ **Running `eb deploy` from the repo root deploys the main app and runs `npm run build` on the server. To deploy only the leaderboard, always use `npm run deploy` from the leaderboard directory.**

   Specify environment name explicitly:
   ```bash
   ./scripts/deploy-eb.sh fixitfaster-leaderboard-victorlee
   ```

**If port 80 rules keep disappearing**  
EB may overwrite security group rules. Run once so the ELB uses the intended group and the rule persists:
   ```bash
   ./scripts/setup-elb-http80.sh fixitfaster-leaderboard-victorlee
   npm run deploy
   ```

What the script does: local `npm run build` → zip including `.next` → upload to S3 → create EB application version → deploy to the environment. The server predeploy hook only runs `npm install --omit=dev`.

---

*Legacy (build on server, risk of timeout):*
```bash
cd leaderboard
eb deploy   # bundle from git → npm install + build on server (slow)
```

## Directory structure

```
leaderboard/
  app/           # Pages and API
  lib/           # Challenge parsing, submission store
  challenges/    # Scenario .md files
  data/          # submissions.json (created at runtime)
  .platform/     # EB deploy hooks
  scripts/       # start-server.js (PORT support)
```
