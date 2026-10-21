# Typed environments

The workspace schema supports string, number, boolean, json, array, enum, secret, file, and reference values.

Example in the environment JSON editor:

```json
{
  "BASE_URL": {"type":"string","value":"https://staging.example.com"},
  "TIMEOUT": {"type":"number","value":30000},
  "DEBUG": {"type":"boolean","value":false},
  "LOCALES": {"type":"array","value":["id","en"]},
  "MODE": {"type":"enum","value":"staging","options":["development","staging","production"]},
  "API_TOKEN": {"type":"secret","secretId":"api-token"},
  "BASE_URL_COPY": {"type":"reference","expression":"{{BASE_URL}}"}
}
```

Existing string-only environment variables are converted into typed strings when loading the workspace.

The `resolveEnvironment` helper merges ordered layers, last wins, and resolves exact variable references with cycle detection. Secrets and files require external value maps and are **not stored in plaintext** by this model.

**Not yet integrated:** PostgreSQL persistence, secret vault, file uploads, runner-time injection, and a per-variable form editor. Do not put secret plaintext in JSON.
