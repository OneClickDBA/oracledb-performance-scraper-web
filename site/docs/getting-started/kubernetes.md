---
title: Kubernetes
sidebar_position: 3
---

# Kubernetes

The scraper needs outbound network access to Oracle and PostgreSQL. It exposes
liveness and leadership-readiness endpoints on port `9161`.

The examples below assume a namespace named `scraper`.

## Secrets

Create Oracle and PostgreSQL credentials:

```bash
kubectl create secret generic oracle-monitoring-secret \
  --from-literal=username=scraperuser \
  --from-literal=password='CHANGE_ME' \
  -n scraper

kubectl create secret generic postgres-monitoring-secret \
  --from-literal=url='postgres://harry_monitoring:CHANGE_ME@postgres:5432/harry_monitoring?sslmode=disable' \
  -n scraper
```

## Config Map

Create a scraper configuration file such as `harry-scraper-config.yaml`:

```yaml
databases:
  prod:
    username: ${ORACLE_USERNAME}
    password: ${ORACLE_PASSWORD}
    url: ${ORACLE_CONNECT_STRING}
    queryTimeout: 10
    connMaxLifetime: 30m
    connMaxIdleTime: 5m
    maxOpenConns: 10
    maxIdleConns: 10

metrics:
  scrapeInterval: 15s

operational:
  enabled: true
  interval: 1m
  queryTimeout: 10s

performance:
  sqlPlans:
    enabled: true
    interval: 2m
    topN: 20
    queryTimeout: 10s

highAvailability:
  enabled: true
  scope: default

output:
  postgresql:
    url: ${POSTGRES_URL}
    autoMigrate: true
    retention: 720h

log:
  level: info
  format: logfmt
  disable: 1

web:
  listenAddresses: [':9161']
```

Create the config map:

```bash
kubectl create cm harry-scraper-config \
  --from-file=harry-scraper-config.yaml \
  -n scraper
```

For user-defined additional metrics, create a config map for the definition
files, mount them into the pod, and list their paths under
`metrics.definitions`.

## Wallets

If using an Oracle wallet, create a config map or secret from the wallet
directory and mount it into the pod. Set either `TNS_ADMIN` or the per-database
`tnsAdmin` property to the mounted path.

## Deployment Shape

A deployment should provide:

- `CONFIG_FILE=/etc/harry/config.yaml`
- `ORACLE_USERNAME` and `ORACLE_PASSWORD` from the Oracle secret
- `ORACLE_CONNECT_STRING` as an environment variable or config value
- `POSTGRES_URL` from the PostgreSQL secret
- a volume mount for the config file
- optional volume mounts for additional metric definitions or wallets

The container command should run:

```bash
/harry-scraper --config.file=/etc/harry/config.yaml
```

Use a non-root user, a read-only root filesystem, and writable temporary/log
volumes as appropriate for your cluster.

Harry HA permits multiple replicas. All replicas intended for the same workload
must use the same PostgreSQL database and `highAvailability.scope`. Only the
leader opens Oracle pools and collects; standbys remain live while unready. See
[High Availability](../configuration/high-availability.md), including its
PostgreSQL split-brain and fencing requirements, before increasing `replicas`.

## Service

Expose port `9161` only for health checks or operational access:

```yaml
ports:
  - name: health
    port: 9161
    targetPort: 9161
```

Health check:

```bash
kubectl port-forward svc/harry-scraper 9161:9161 -n scraper
curl http://127.0.0.1:9161/healthz
```

Configure separate probes:

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 9161
readinessProbe:
  httpGet:
    path: /readyz
    port: 9161
```

Do not use `/readyz` for liveness because a standby is intentionally unready.

## Grafana

Grafana should use a PostgreSQL datasource connected to the same PostgreSQL
database used by the scraper. Import or provision the dashboards from:

```text
docker-compose/grafana/dashboards/
```
