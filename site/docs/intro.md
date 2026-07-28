---
sidebar_position: 1
---

# Oracle DB Performance Scraper

Oracle DB Performance Scraper collects Oracle database performance data on a
schedule and stores it in PostgreSQL for Grafana dashboards and troubleshooting.

:::warning
Oracle Diagnostics Pack  
The Oracle ASH collector is **DISABLED by default**.   
Enabling it requires that **YOU verify your Oracle Diagnostics Pack licensing**.
:::

This is not a Prometheus exporter. It does not expose Oracle metrics on `/metrics`. Instead, it:

- connects to one or more Oracle databases,
- collects native operational, SQL, session, blocking-session, and
  session-sampled database activity by default,
- optionally collects additional SQL-derived metrics from TOML or YAML
  definitions,
- writes those samples to PostgreSQL,
- exposes a small health endpoint on `/healthz`,
- lets Grafana read PostgreSQL directly.

Native performance data uses dedicated PostgreSQL tables. Details such as
`SQL_ID`, child cursor, plan hash, SID, serial number, module, machine, wait
event, and blocking session remain relational columns that can be indexed and
queried by SQL-backed Grafana dashboards.

## Main Features

- Scheduled Oracle scraping controlled by `metrics.scrapeInterval`.
- PostgreSQL storage using batched inserts.
- Daily range-partitioned PostgreSQL sample tables created on demand.
- Optional PostgreSQL retention that drops old daily partitions.
- Native operational collection for database state, instance load, resource
  limits, storage capacity, system counters, wait classes, and collection
  health.
- Optional additional metrics loaded from ordered TOML or YAML definition
  files.
- Direct performance collection from Oracle dynamic performance views:
  - `GV$SQLSTATS`
  - `GV$SQL`
  - `GV$SQL_PLAN`
  - `GV$SESSION`
  - optional `GV$ACTIVE_SESSION_HISTORY`, only when explicitly enabled
- Grafana dashboards backed by PostgreSQL:
  - Database Activity History (DAH)
  - Oracle SQL Performance
  - Oracle SQL Top Consumers
  - Current Sessions and Blocking
  - Oracle Operational Overview
- Provisioned starter Grafana alerts backed directly by PostgreSQL.
- Oracle alert log export to JSON files.
- Oracle wallet, external authentication, OCI Vault, Azure Vault, and HashiCorp
  Vault credential integrations inherited from the upstream codebase.
- Builds with either `godror` and Oracle Instant Client, or the no-CGO `go-ora`
  driver using `-tags goora`.

## PostgreSQL Tables

The scraper writes to these primary PostgreSQL tables:

- `oracle_metric_samples`
- `oracle_sql_samples`
- `oracle_sql_texts`
- `oracle_sql_plans`
- `oracle_session_samples`
- `oracle_blocking_session_samples`
- `oracle_database_activity_samples`
- `oracle_database_status_samples`
- `oracle_instance_samples`
- `oracle_resource_limit_samples`
- `oracle_tablespace_samples`
- `oracle_asm_diskgroup_samples`
- `oracle_system_counter_samples`
- `oracle_wait_class_samples`
- `oracle_system_metric_samples`
- `oracle_scrape_status`

When `output.postgresql.autoMigrate: true` is configured, the scraper creates
the parent partitioned tables, the SQL text and execution-plan lookup tables,
and indexes automatically. Daily child partitions are created just before data
is written.

## Supported Oracle Versions

The scraper is intended for Oracle Database 19c and newer. The default activity
collector uses `GV$SESSION`. `GV$ACTIVE_SESSION_HISTORY` is accessed only when
the operator explicitly configures `performance.activity.source: ash`.

## Acknowledgements

Oracle DB Performance Scraper is developed and maintained by Jorge Holgado
[dodger@oneclickdba.com](mailto:dodger@oneclickdba.com).

This project started from Oracle's application observability codebase, which
itself incorporated earlier Oracle monitoring work from Seth Miller. The current
fork changes the runtime model from Prometheus exposition to scheduled
collection into PostgreSQL.
