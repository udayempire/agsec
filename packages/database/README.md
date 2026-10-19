# AgSec database package

Prisma schema and migration tooling for the API's durable session, audit, and policy data.
The datasource uses PostgreSQL. Set `DATABASE_URL` to a PostgreSQL connection
string before starting the API or running Prisma commands.

Run from the repository root:

```sh
bun run --cwd packages/database db:validate
bun run --cwd packages/database db:generate
bun run --cwd packages/database db:migrate
bun run --cwd packages/database db:studio
```

`AuditEvent` deliberately stores policy and resource metadata only. It has no field for
tool arguments, file contents, or HTTP request bodies. `PolicyRule.match` stores the
validated rule matcher as JSON, and `matchedRules` stores the matched rule identifiers.

The API writes audit events and their session records to PostgreSQL in one
transaction. Live subscribers receive an event only after the database commit
succeeds.
