# Computer Use on Windows

> Local Windows proof-of-concept architecture for OpenAI-powered desktop control.

## Why this exists

OpenAI now supports `computer use` for `gpt-5.4` and `gpt-5.4-mini` through the Responses API, but the model does not directly move your mouse or type on its own. Your local harness must:

1. Capture the current UI as a screenshot.
2. Ask the model what to do next.
3. Execute the returned actions locally.
4. Capture a new screenshot and continue the loop.

This document defines a safe local POC for Windows that lives outside the main Next.js app.

## Current OpenAI guidance

As of `April 13, 2026`, OpenAI's public docs describe three supported patterns:

1. Built-in `computer` tool in the Responses API.
2. A custom tool or custom harness layered on top of an existing automation environment.
3. A code-execution harness that mixes screenshots with programmatic control.

The same docs also recommend:

- Running computer-use flows in an isolated browser, container, or VM when possible.
- Keeping a human in the loop for destructive or high-impact actions.
- Treating on-screen content as untrusted input.

Reference links:

- `https://developers.openai.com/api/docs/guides/tools-computer-use`
- `https://developers.openai.com/api/docs/guides/latest-model#computer-use-tool`
- `https://developers.openai.com/tracks/building-agents#computer-use`
- `https://developers.openai.com/api/docs/models/gpt-5.4`
- `https://developers.openai.com/api/docs/models/gpt-5.4-mini`
- `https://developers.openai.com/api/docs/models/gpt-5`

## POC decision

For this repository, the first iteration uses a `custom harness` instead of wiring the built-in `computer` tool end-to-end.

Why:

- It is easier to audit locally on Windows.
- It keeps the proof of concept self-contained under `.external/`.
- It uses standard Responses API function calling plus screenshot vision, which is simpler to debug.
- It lets us keep hard safety gates around local input execution.

Inference from the docs:
The built-in `computer` loop is the long-term production path, but a custom harness is the fastest safe path for a Windows prototype in this repo.

## POC layout

```text
.external/openai-computer-use/
├── README.md
├── package.json
├── config.example.json
├── .gitignore
├── src/
│   └── run.mjs
└── powershell/
    ├── capture-screen.ps1
    └── desktop-action.ps1
```

## Execution model

The local POC loop is:

1. Capture either the active window or full desktop.
2. Send the screenshot plus the user goal to the Responses API.
3. Let the model call a local function schema named `desktop_action_batch`.
4. Validate the returned batch against local safety rules.
5. Execute the allowed batch through PowerShell and Win32 APIs.
6. Capture a fresh screenshot.
7. Send the execution result back as `function_call_output`.
8. Repeat until the model reports completion or the harness halts.

## Safety model

The POC is intentionally conservative.

- It defaults to `gpt-5.4-mini` for cost and speed.
- It can stop on risky keywords such as `delete`, `purchase`, `send`, `submit`, `install`, `password`, `otp`, and `api key`.
- It supports `--dry-run` so the model can plan without touching the desktop.
- It stores screenshots and response JSON in a local output folder for auditability.
- It avoids wiring credentials, browser profiles, or secret stores into the harness.

## Supported local actions

The Windows executor supports these action types:

- `click`
- `double_click`
- `move`
- `scroll`
- `type`
- `keypress`
- `drag`
- `wait`

This is enough for a serious proof of concept, but it is not yet a production-safe desktop agent.

## Known limitations

- No VM isolation yet.
- No domain allowlist or browser sandbox yet.
- No first-class human approval UI yet.
- `SendKeys` is good enough for a POC, but not ideal for every Windows app.
- The harness is focused on one active desktop session, not unattended background control.
- Some automation runners strip Windows env vars such as `SystemRoot`, `windir`, and `ComSpec`. When that happens, legacy CryptoAPI providers fail to initialize, which can make both `node` and `bun` crash on startup. The included `.external/openai-computer-use/run.ps1` launcher repairs those vars before starting the runtime.

## Production next steps

If we decide to take this beyond the POC, the next upgrades should be:

1. Move execution into a dedicated VM.
2. Add explicit approval checkpoints for risky actions.
3. Restrict execution to specific windows, processes, or browser profiles.
4. Add stronger audit logging and replay traces.
5. Consider moving from the custom function-call harness to the built-in OpenAI `computer` tool loop once we want deeper parity with the official model flow.
