---
title: Roadmap
sidebar_position: 1
---

# Scraper Roadmap

The project is moving from a Prometheus metrics endpoint to an Oracle
performance scraper backed by PostgreSQL and Grafana.

Near-term work is focused on useful troubleshooting data that is too
high-cardinality for Prometheus:

- Improve Database Activity History dashboards and drilldowns.
- Expand SQL performance views around SQL ID, plan hash, executions, elapsed
  time, CPU, I/O, and wait behavior.
- Expand current session and blocking-session dashboards.
- Add Temp, PGA, and object hotspot collectors and dashboards.
- Improve PostgreSQL partitioning and retention operations.
- Add more operational documentation for real server installs.
- Improve alert log collection and dashboarding.
- Provide additional pre-built Grafana dashboards.

Bounded operational measurements can use optional files listed under
`metrics.definitions` and stored in `oracle_metric_samples`. Unbounded
diagnostic entities should use dedicated typed collectors and tables.
