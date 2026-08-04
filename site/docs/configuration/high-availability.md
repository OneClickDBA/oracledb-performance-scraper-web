---
title: High Availability
sidebar_position: 3
---

# High Availability

Harry provides active/standby operation through a session-level PostgreSQL
advisory lock. High availability is enabled by default, including when the
`highAvailability` section is omitted.

Multiple Harry instances may run in different datacenters without a shared
virtual IP. Each instance connects to the PostgreSQL backend and competes for
the same scope. Exactly one lock owner becomes active; the others remain
standby and retry until leadership is available.

```yaml
highAvailability:
  enabled: true
  scope: default
  retryInterval: 5s
  validationInterval: 2s
```

Defaults:

| Property | Default | Meaning |
| --- | --- | --- |
| `enabled` | `true` | Require PostgreSQL leadership before collecting. |
| `scope` | `default` | Human-readable election-group name. |
| `retryInterval` | `5s` | Delay between standby acquisition attempts. |
| `validationInterval` | `2s` | Interval for validating the leader connection. |

`scope` accepts lowercase letters, digits, `.`, `_`, and `-`, must begin with a
letter or digit, and is limited to 63 characters. Harry deterministically
derives the internal advisory-lock key; users do not configure a numeric lock
ID.

Instances using the same PostgreSQL database and scope form one election
group. Use the same scope on every replica intended to protect the same
collection workload. **Different scopes are independent leaders** and will
duplicate collection if they contain the same Oracle database definitions.

## Runtime Behavior

Before acquiring leadership, a standby:

- runs the HTTP health service;
- holds at most one PostgreSQL election connection while attempting the lock;
- does not open Oracle connection pools;
- does not create the normal PostgreSQL write pool;
- does not migrate or clean PostgreSQL storage;
- does not collect performance, operational, additional, or alert-log data.

The active instance holds the advisory lock on a dedicated PostgreSQL session.
That connection is never returned to the write pool. Harry also verifies on
that session that PostgreSQL is not in recovery and transactions are writable.

If the connection fails or is no longer attached to a writable primary, Harry
immediately marks itself unready, cancels collection, closes its connections,
and exits with a non-zero status. The service manager or container platform
must restart it. A clean process exit releases the session advisory lock.

This restart-based behavior rebuilds all Oracle and PostgreSQL connections
after failover instead of preserving partially completed collection state.

## PostgreSQL HA Connection

pgx accepts PostgreSQL URI and keyword/value connection strings with multiple
hosts. For direct Patroni member addresses, use `target_session_attrs=read-write`
so connection establishment selects a writable node, plus a short per-host
connection timeout:

```text
postgresql://harry_monitoring:CHANGE_ME@pg-a:5432,pg-b:5432,pg-c:5432/harry_monitoring?target_session_attrs=read-write&connect_timeout=3
```

Equivalent keyword/value form:

```text
host=pg-a,pg-b,pg-c port=5432 dbname=harry_monitoring user=harry_monitoring password=CHANGE_ME target_session_attrs=read-write connect_timeout=3
```

The same `output.postgresql.url` is used first for HA election and then for the
leader's normal write pool. `connect_timeout` applies to each candidate host.
Keep the password in an environment variable or secret rather than directly in
the YAML file.

The dedicated leader connection is additional to `output.postgresql.maxConns`.
An active process can therefore use up to `maxConns + 1` PostgreSQL
connections; a standby uses at most one at a time.

## PostgreSQL Permissions

PostgreSQL normally grants `PUBLIC` execute access to the built-in advisory-lock
and recovery-status functions. No extra grant is usually required. On a
hardened cluster where execute access has been revoked, the Harry role needs
permission to call `pg_try_advisory_lock(bigint)`, `pg_is_in_recovery()`, and
`current_setting(text)`. It does not require PostgreSQL superuser privileges for
leader election.

## PostgreSQL Split-Brain Protection

:::danger PostgreSQL fencing is mandatory

Harry uses PostgreSQL as its source of leadership. Advisory locks guarantee a
single Harry leader only while the PostgreSQL HA system guarantees a single
writable primary. They do **not** replace Patroni DCS quorum, watchdog, STONITH,
or another effective fencing mechanism.

If two PostgreSQL nodes accept writes during a split-brain event, separate
Harry instances may each acquire an advisory lock and both scrape Oracle. The
correctness of PostgreSQL leader election and old-primary fencing is an
infrastructure responsibility outside Harry.

:::

Test PostgreSQL failover and fencing before relying on Harry HA. The required
outcome is that the old primary stops accepting writes before or as the new
primary is promoted.

## Health And Readiness

The HTTP listener exposes two distinct checks:

- `/healthz` returns HTTP `200` while the Harry process is running, including
  while it is standby and waiting for leadership.
- `/readyz` returns HTTP `200` only for the active instance after its write pool
  and collection loops have started. Standbys return HTTP `503`.

Use `/healthz` for liveness and `/readyz` for readiness. Do not use readiness as
a liveness probe: restarting a healthy standby repeatedly does not improve
failover.

For systemd, configure automatic restart because loss of leadership exits the
process intentionally:

```ini
[Service]
Restart=on-failure
RestartSec=2s
```

## Disabling HA

For troubleshooting or an environment that cannot grant advisory-lock access:

```yaml
highAvailability:
  enabled: false
```

The instance then starts collection immediately and `/readyz` becomes ready
after the PostgreSQL sink and collection loops start. Running more than one
instance with HA disabled produces duplicate samples.
