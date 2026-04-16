$ErrorActionPreference = 'Stop'

$runtime = 'auto'
$doctor = $false
$passthrough = New-Object System.Collections.Generic.List[string]

for ($i = 0; $i -lt $args.Count; $i++) {
  switch ($args[$i]) {
    '--runtime' {
      if ($i + 1 -ge $args.Count) {
        throw 'Missing value for --runtime. Use auto, bun, or node.'
      }
      $i++
      $runtime = $args[$i]
      continue
    }
    '--doctor' {
      $doctor = $true
      continue
    }
    default {
      [void]$passthrough.Add($args[$i])
    }
  }
}

if ($runtime -notin @('auto', 'bun', 'node')) {
  throw "Unsupported --runtime '$runtime'. Use auto, bun, or node."
}

function Set-ProcessEnvIfMissing {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [string]$Value
  )

  $current = [Environment]::GetEnvironmentVariable($Name, 'Process')
  if ([string]::IsNullOrWhiteSpace($current)) {
    [Environment]::SetEnvironmentVariable($Name, $Value, 'Process')
  }
}

$windowsRoot = [Environment]::GetEnvironmentVariable('SystemRoot', 'Process')
if ([string]::IsNullOrWhiteSpace($windowsRoot)) {
  $windowsRoot = [Environment]::GetEnvironmentVariable('windir', 'Process')
}
if ([string]::IsNullOrWhiteSpace($windowsRoot)) {
  $windowsRoot = 'C:\Windows'
}

Set-ProcessEnvIfMissing -Name 'SystemRoot' -Value $windowsRoot
Set-ProcessEnvIfMissing -Name 'windir' -Value $windowsRoot
Set-ProcessEnvIfMissing -Name 'ComSpec' -Value (Join-Path $windowsRoot 'System32\cmd.exe')

function Resolve-RuntimeCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Choice
  )

  if ($Choice -eq 'bun') {
    return Get-Command bun.exe -ErrorAction SilentlyContinue
  }

  if ($Choice -eq 'node') {
    return Get-Command node.exe -ErrorAction SilentlyContinue
  }

  $bun = Get-Command bun.exe -ErrorAction SilentlyContinue
  if ($null -ne $bun) {
    return $bun
  }

  return Get-Command node.exe -ErrorAction SilentlyContinue
}

$runtimeCommand = Resolve-RuntimeCommand -Choice $runtime
if ($null -eq $runtimeCommand) {
  throw "Could not find a supported runtime for '$runtime'. Install Bun or Node.js."
}

if ($doctor) {
  [pscustomobject]@{
    requestedRuntime = $runtime
    resolvedRuntime = $runtimeCommand.Name
    resolvedPath = $runtimeCommand.Path
    systemRoot = [Environment]::GetEnvironmentVariable('SystemRoot', 'Process')
    windir = [Environment]::GetEnvironmentVariable('windir', 'Process')
    comSpec = [Environment]::GetEnvironmentVariable('ComSpec', 'Process')
  } | ConvertTo-Json -Compress

  if ($passthrough.Count -eq 0) {
    exit 0
  }
}

$entryPoint = Join-Path $PSScriptRoot 'src\run.mjs'
& $runtimeCommand.Path $entryPoint @passthrough
exit $LASTEXITCODE
