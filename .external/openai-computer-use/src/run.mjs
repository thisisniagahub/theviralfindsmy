import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const currentFilePath = fileURLToPath(import.meta.url)
const rootDir = path.resolve(__dirname, '..')
const powershellDir = path.join(rootDir, 'powershell')
const powershellExecutable = process.env.CUA_POWERSHELL || 'pwsh'

function printHelp() {
  console.log(`
OpenAI Computer Use Windows POC

Usage:
  .\\run.ps1 --goal "Open Notepad and type hello world"

Options:
  --goal <text>       Required task goal
  --config <path>     Optional config path (default: ./config.json or ./config.example.json)
  --max-steps <n>     Override max steps
  --dry-run           Plan only, do not execute local actions
  --help              Show this help
`)
}

function parseArgs(argv) {
  const args = {
    dryRun: false
  }

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]

    switch (value) {
      case '--goal':
        args.goal = argv[index + 1]
        index += 1
        break
      case '--config':
        args.config = argv[index + 1]
        index += 1
        break
      case '--max-steps':
        args.maxSteps = Number.parseInt(argv[index + 1], 10)
        index += 1
        break
      case '--dry-run':
        args.dryRun = true
        break
      case '--help':
        args.help = true
        break
      default:
        break
    }
  }

  return args
}

function loadConfig(configPath) {
  const preferredPath = configPath
    ? path.resolve(process.cwd(), configPath)
    : path.join(rootDir, 'config.json')

  const fallbackPath = path.join(rootDir, 'config.example.json')
  const resolvedPath = fs.existsSync(preferredPath) ? preferredPath : fallbackPath
  const config = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'))

  return {
    ...config,
    _path: resolvedPath
  }
}

function ensureOutputDir() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outputDir = path.join(rootDir, 'output', stamp)
  fs.mkdirSync(outputDir, { recursive: true })
  return outputDir
}

function runPowerShell(scriptName, args = []) {
  const scriptPath = path.join(powershellDir, scriptName)
  const result = spawnSync(
    powershellExecutable,
    ['-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args],
    {
      encoding: 'utf8'
    }
  )

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `PowerShell script failed: ${scriptName}`)
  }

  return result.stdout.trim()
}

function captureScreen(activeWindow) {
  const raw = runPowerShell('capture-screen.ps1', [
    '-Mode',
    'temp',
    ...(activeWindow ? ['-ActiveWindow'] : [])
  ])

  return JSON.parse(raw)
}

function copyArtifact(sourcePath, targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  fs.copyFileSync(sourcePath, targetPath)
}

function imagePathToDataUrl(imagePath) {
  const buffer = fs.readFileSync(imagePath)
  return `data:image/png;base64,${buffer.toString('base64')}`
}

function buildActionTool() {
  return [
    {
      type: 'function',
      name: 'desktop_action_batch',
      description: 'Plan the next safe batch of Windows desktop UI actions for the current screenshot.',
      strict: true,
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          goal_status: {
            type: 'string',
            enum: ['in_progress', 'blocked', 'completed']
          },
          summary: {
            type: 'string'
          },
          needs_human_review: {
            type: 'boolean'
          },
          human_review_reason: {
            type: 'string'
          },
          actions: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                type: {
                  type: 'string',
                  enum: ['click', 'double_click', 'move', 'scroll', 'type', 'keypress', 'drag', 'wait']
                },
                x: { type: 'integer' },
                y: { type: 'integer' },
                startX: { type: 'integer' },
                startY: { type: 'integer' },
                endX: { type: 'integer' },
                endY: { type: 'integer' },
                deltaY: { type: 'integer' },
                durationMs: { type: 'integer' },
                text: { type: 'string' },
                keys: { type: 'string' },
                button: {
                  type: 'string',
                  enum: ['left', 'right', 'middle']
                }
              },
              required: ['type']
            }
          }
        },
        required: ['goal_status', 'summary', 'needs_human_review', 'human_review_reason', 'actions']
      }
    }
  ]
}

function extractFunctionCall(response) {
  return response.output.find((item) => item.type === 'function_call') || null
}

function extractMessageText(response) {
  const message = response.output.find((item) => item.type === 'message')
  if (!message) {
    return ''
  }

  return message.content
    .filter((part) => part.type === 'output_text')
    .map((part) => part.text)
    .join('\n')
}

function containsBlockedTerm(text, blockedTerms) {
  const haystack = String(text || '').toLowerCase()
  return blockedTerms.some((term) => haystack.includes(term.toLowerCase()))
}

function isRiskyPlan(plan, blockedTerms) {
  const stringsToInspect = [
    plan.summary,
    plan.human_review_reason,
    ...plan.actions.flatMap((action) => [action.text, action.keys])
  ]

  return stringsToInspect.some((value) => containsBlockedTerm(value, blockedTerms))
}

function buildInstructions() {
  return [
    'You are controlling a Windows desktop through a custom local harness.',
    'You can only see the current screenshot and request actions through the desktop_action_batch tool.',
    'Use the smallest safe action batch possible.',
    'Do not take destructive, purchasing, credential, installation, or submission actions unless the user explicitly asked for that and the plan marks needs_human_review true.',
    'If the goal is complete, do not call the tool; answer with a short completion message.',
    'If coordinates are uncertain, prefer move or wait over reckless clicking.'
  ].join(' ')
}

async function createResponse(payload) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OpenAI API error ${response.status}: ${body}`)
  }

  return response.json()
}

function actionArgsToPowerShell(action) {
  const args = ['-Action', action.type]

  for (const [key, value] of Object.entries(action)) {
    if (key === 'type' || value === undefined || value === null) {
      continue
    }

    const psName = `-${key.charAt(0).toUpperCase()}${key.slice(1)}`
    args.push(psName, String(value))
  }

  return args
}

function executeAction(action, dryRun) {
  if (dryRun) {
    return {
      action: action.type,
      status: 'dry_run',
      detail: action
    }
  }

  const raw = runPowerShell('desktop-action.ps1', actionArgsToPowerShell(action))
  return JSON.parse(raw)
}

export async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  if (!args.goal) {
    printHelp()
    process.exitCode = 1
    return
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required.')
  }

  const config = loadConfig(args.config)
  const outputDir = ensureOutputDir()
  const blockedTerms = config.safety?.blockedTerms || []
  const activeWindow = Boolean(config.screenshot?.activeWindow)
  const maxSteps = Number.isFinite(args.maxSteps) ? args.maxSteps : (config.maxSteps || 8)
  const dryRun = args.dryRun

  console.log(`Using config: ${config._path}`)
  console.log(`Artifacts: ${outputDir}`)
  console.log(`Goal: ${args.goal}`)
  console.log(`Mode: ${dryRun ? 'dry-run' : 'live'}`)

  const tools = buildActionTool()
  let previousResponseId = null
  let pendingFunctionCall = null
  let lastExecutionSummary = null

  for (let step = 1; step <= maxSteps; step += 1) {
    const screenshot = captureScreen(activeWindow)
    const copiedScreenshotPath = path.join(outputDir, `step-${String(step).padStart(2, '0')}-screen.png`)
    copyArtifact(screenshot.path, copiedScreenshotPath)

    const screenshotDataUrl = imagePathToDataUrl(copiedScreenshotPath)
    const stepPrompt = [
      `Goal: ${args.goal}`,
      `Step: ${step} of ${maxSteps}`,
      screenshot.windowTitle ? `Active window: ${screenshot.windowTitle}` : 'Active window title unavailable.',
      'Use the screenshot to decide the next smallest safe action batch.'
    ].join('\n')

    const input = pendingFunctionCall
      ? [
          {
            type: 'function_call_output',
            call_id: pendingFunctionCall.call_id,
            output: JSON.stringify(lastExecutionSummary)
          },
          {
            role: 'user',
            content: [
              { type: 'input_text', text: stepPrompt },
              { type: 'input_image', image_url: screenshotDataUrl }
            ]
          }
        ]
      : [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: stepPrompt },
              { type: 'input_image', image_url: screenshotDataUrl }
            ]
          }
        ]

    const response = await createResponse({
      model: config.model || 'gpt-5.4-mini',
      instructions: buildInstructions(),
      previous_response_id: previousResponseId,
      input,
      tools,
      tool_choice: 'auto'
    })

    fs.writeFileSync(
      path.join(outputDir, `step-${String(step).padStart(2, '0')}-response.json`),
      JSON.stringify(response, null, 2)
    )

    previousResponseId = response.id
    pendingFunctionCall = extractFunctionCall(response)

    if (!pendingFunctionCall) {
      const finalText = extractMessageText(response)
      console.log('\nModel finished without another action batch.\n')
      console.log(finalText || 'No assistant text returned.')
      fs.writeFileSync(
        path.join(outputDir, 'final-summary.txt'),
        finalText || 'No assistant text returned.'
      )
      return
    }

    const plan = JSON.parse(pendingFunctionCall.arguments)
    console.log(`\nStep ${step} plan: ${plan.summary}`)

    if (plan.needs_human_review) {
      console.log(`Human review required: ${plan.human_review_reason}`)
      fs.writeFileSync(
        path.join(outputDir, 'halted-review.json'),
        JSON.stringify(plan, null, 2)
      )
      return
    }

    if (config.safety?.stopOnRiskyAction && isRiskyPlan(plan, blockedTerms)) {
      console.log('Risk gate stopped execution because the plan matched blocked terms.')
      fs.writeFileSync(
        path.join(outputDir, 'halted-risk.json'),
        JSON.stringify(plan, null, 2)
      )
      return
    }

    const results = plan.actions.map((action) => executeAction(action, dryRun))
    lastExecutionSummary = {
      dryRun,
      goalStatus: plan.goal_status,
      summary: plan.summary,
      results
    }

    fs.writeFileSync(
      path.join(outputDir, `step-${String(step).padStart(2, '0')}-execution.json`),
      JSON.stringify(lastExecutionSummary, null, 2)
    )

    if (plan.goal_status === 'completed' && plan.actions.length === 0) {
      console.log('Model reported completion with no further actions.')
      fs.writeFileSync(
        path.join(outputDir, 'final-summary.txt'),
        plan.summary
      )
      return
    }
  }

  console.log(`Reached max steps without completion. Review artifacts in ${outputDir}.`)
}

const directTarget = process.argv[1] ? path.resolve(process.argv[1]) : ''
const isDirectRun = directTarget === currentFilePath

if (isDirectRun) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
