# OpenAI Computer Use Windows POC

This folder contains a local Windows proof of concept for desktop control using:

- OpenAI Responses API
- Screenshot-based state updates
- A custom `desktop_action_batch` function tool
- Local PowerShell execution for mouse and keyboard actions

It is intentionally isolated from the main Next.js app.

## What this POC does

The harness captures your current desktop state, asks the model for the next action batch, executes safe actions locally, then sends back the updated screenshot.

This matches OpenAI's documented custom-harness pattern for computer use:

- `https://developers.openai.com/api/docs/guides/tools-computer-use`
- `https://developers.openai.com/tracks/building-agents#computer-use`

## Safety warning

This is a local proof of concept, not a production-safe unattended agent.

- Use `--dry-run` first.
- Avoid running it on a desktop with sensitive accounts open.
- Prefer a separate Windows VM if you want to push it further.
- Review `config.example.json` before real use.

## Requirements

- Windows
- PowerShell
- Bun or Node.js 18+
- `OPENAI_API_KEY` set in your environment

The safest entrypoint is the included PowerShell launcher. It repairs missing core Windows env vars like `SystemRoot`, `windir`, and `ComSpec` before starting `bun` or `node`.

## Quick start

```powershell
cd .external/openai-computer-use
copy config.example.json config.json
setx OPENAI_API_KEY "your_api_key_here"
.\run.ps1 --goal "Open Notepad and type hello world" --dry-run
```

Then, when the plan looks reasonable:

```powershell
.\run.ps1 --goal "Open Notepad and type hello world"
```

## Useful commands

```powershell
.\run.ps1 --doctor
.\run.ps1 --help
.\run.ps1 --goal "Focus the browser address bar" --dry-run
pwsh -ExecutionPolicy Bypass -File .\powershell\capture-screen.ps1 -Mode temp -ActiveWindow
```

## Output

Run artifacts are stored in:

```text
.external/openai-computer-use/output/<timestamp>/
```

Each run keeps:

- response JSON per step
- copied screenshots per step
- final summary

## Supported actions

- `click`
- `double_click`
- `move`
- `scroll`
- `type`
- `keypress`
- `drag`
- `wait`

## Main limitations

- It uses a custom tool schema, not the built-in OpenAI `computer` tool loop.
- It uses `SendKeys` for text and some hotkeys, which is not perfect across all Windows apps.
- It has a keyword-based local risk gate, which is intentionally conservative.
- In stripped automation environments, calling `bun` or `node` directly can fail if Windows env vars are missing. Use `.\run.ps1` as the default entrypoint.
