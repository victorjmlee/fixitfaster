# Scenario: Nginx check not running (Autodiscovery)

**Difficulty:** ⭐⭐ Intermediate
**Estimated time:** 15–20 min
**Related Datadog products:** Agent, Autodiscovery, Integrations


## Symptom summary

An nginx container (ad-demo-nginx) is running, but the nginx integration check does not run for it — or in agent status the nginx check shows no discovered instance. The Agent is running and the Docker check is OK. You need to find why the nginx check is not being applied to the container and fix it.


## Environment

- Nginx container: fixitfaster-ad-demo-nginx (image nginx:alpine).
- Agent: Datadog Agent 7.x (Docker), with docker.sock mounted; integration config is provided via a mounted file under conf.d.


## Steps to reproduce / What to observe

1. Run the stack (e.g. npm run up) so that the agent and ad-demo-nginx container are up.
2. Check agent status for the nginx check: the nginx check may be missing or show "No service found with this AD identifier" (or similar).
3. In Datadog, the nginx integration may report no data for this host/container.
4. The Docker check in the agent is OK; the nginx container is visible to Docker.
5. So: the agent sees Docker, but the nginx check is not attached to the nginx container.


## What to investigate (hints)

- Review how Autodiscovery matches containers: ad_identifiers and container image/short image.
- Check where the nginx integration config is loaded from (file vs labels) and what identifier it uses.
- Internal docs: Autodiscovery Troubleshooting (Docker); Datadog docs: Autodiscovery, Container identifiers.


## Allowed resources

- Datadog documentation
- Internal wiki
- AI prohibited

## Helpful Commands

Check Agent and nginx container:
docker ps | grep -E "agent|ad-demo-nginx"
docker exec fixitfaster-agent agent status

Check nginx container image/short image:
docker inspect fixitfaster-ad-demo-nginx --format '{{.Config.Image}}'

Restart the agent (after editing config):
cd ~/fixitfaster-agent
npm run agent:restart

Rebuild/restart ad-demo-nginx if needed:
cd ~/fixitfaster-agent
docker compose --env-file .env.local up -d ad-demo-nginx

## Submission format (for participants)

- Root cause summary:
- Resolution steps:
- Documentation / links used:
- Time taken:
