# Scenario: Nginx check not running (Autodiscovery)

**Difficulty:** ⭐⭐ Intermediate
**Estimated time:** 15–20 min
**Related Datadog products:** Agent, Autodiscovery, Integrations


## Symptom summary

nginx 컨테이너(ad-demo-nginx)는 실행 중이지만, nginx 통합 체크가 동작하지 않습니다. agent status에서 nginx 체크에 발견된 인스턴스가 없을 수 있습니다. Agent는 동작 중이고 Docker 체크는 정상입니다. nginx 체크가 해당 컨테이너에 적용되지 않는 원인을 찾아 수정해야 합니다.


## Environment

- Nginx 컨테이너: fixitfaster-ad-demo-nginx (이미지 nginx:alpine).
- Agent: Datadog Agent 7.x (Docker), docker.sock 마운트; 통합 설정은 conf.d 아래 마운트된 파일로 제공.


## Steps to reproduce / What to observe

1. agent status에서 nginx 체크를 확인합니다. nginx 체크가 없거나 "No service found with this AD identifier" 등이 나올 수 있습니다.
2. Datadog에서 nginx 통합이 이 호스트/컨테이너에 대한 데이터를 보고하지 않을 수 있습니다.
3. Agent의 Docker 체크는 정상이고, nginx 컨테이너는 Docker에서 보입니다.
4. 정리: Agent는 Docker를 보지만, nginx 체크가 nginx 컨테이너에 붙지 않습니다.


## What to investigate (hints)

- Autodiscovery가 컨테이너를 어떻게 매칭하는지 검토: ad_identifiers와 컨테이너 이미지/short image.
- nginx 통합 설정이 어디서 로드되는지(파일 vs 라벨), 어떤 식별자를 쓰는지 확인.
- 내부 문서: Autodiscovery 트러블슈팅(Docker); Datadog 문서: Autodiscovery, Container identifiers.


## Allowed resources

- Datadog 문서
- 내부 위키
- AI 사용 금지

## Helpful Commands

Agent 및 nginx 컨테이너 확인:
docker ps | grep -E "agent|ad-demo-nginx"
docker exec fixitfaster-agent agent status

nginx 컨테이너 이미지/short image 확인:
docker inspect fixitfaster-ad-demo-nginx --format '{{.Config.Image}}'

설정 수정 후 Agent 재시작:
cd ~/fixitfaster-agent
npm run agent:restart
