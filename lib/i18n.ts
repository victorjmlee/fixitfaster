export type Locale = "ko" | "en";

export const translations: Record<Locale, Record<string, string>> = {
  en: {
    "nav.leaderboard": "Leaderboard",
    "nav.lab": "Lab",
    "nav.start": "Setup guide",
    "leaderboard.title": "Leaderboard",
    "leaderboard.subtitle": "Ranked by total score (sum of all scenarios) then by total time. One row per participant.",
    "leaderboard.reset": "Reset leaderboard",
    "leaderboard.noSubmissions": "No submissions yet.",
    "leaderboard.backToHome": "Back to home",
    "leaderboard.participant": "Participant",
    "leaderboard.total": "Total",
    "leaderboard.totalTime": "Total time",
    "leaderboard.lastSubmitted": "Last submitted",
    "leaderboard.loading": "Loading...",
    "leaderboard.confirmReset": "Clear the entire leaderboard?",
    "scenario.scenario-infra": "Infra (Hostname)",
    "scenario.scenario-autodiscovery": "Autodiscovery",
    "scenario.scenario-apm": "APM",
    "scenario.scenario-correlation": "Correlation",
    "scenario.scenario-custom-metrics": "Custom metrics",
    "scenario.scenario-log-timezone": "Log timezone",
  },
  ko: {
    "nav.leaderboard": "리더보드",
    "nav.lab": "랩",
    "nav.start": "설정 가이드",
    "leaderboard.title": "리더보드",
    "leaderboard.subtitle": "총점(시나리오 합산) 순, 동점이면 총 시간 짧은 순. 참가자당 한 줄.",
    "leaderboard.reset": "리더보드 초기화",
    "leaderboard.noSubmissions": "아직 제출이 없습니다.",
    "leaderboard.backToHome": "홈으로 돌아가기",
    "leaderboard.participant": "참가자",
    "leaderboard.total": "총점",
    "leaderboard.totalTime": "총 시간",
    "leaderboard.lastSubmitted": "마지막 제출",
    "leaderboard.loading": "불러오는 중...",
    "leaderboard.confirmReset": "리더보드를 모두 초기화할까요?",
    "scenario.scenario-infra": "인프라 (호스트명)",
    "scenario.scenario-autodiscovery": "Autodiscovery",
    "scenario.scenario-apm": "APM",
    "scenario.scenario-correlation": "Correlation",
    "scenario.scenario-custom-metrics": "커스텀 메트릭",
    "scenario.scenario-log-timezone": "로그 타임존",
  },
};

export function getT(locale: Locale) {
  const strings = translations[locale];
  const fallback = translations.en;
  return (key: string): string => strings[key] ?? fallback[key] ?? key;
}
