param(
  [Parameter(Mandatory = $true)][string]$Action,
  [int]$X,
  [int]$Y,
  [int]$StartX,
  [int]$StartY,
  [int]$EndX,
  [int]$EndY,
  [int]$DeltaX,
  [int]$DeltaY,
  [int]$DurationMs = 250,
  [string]$Text,
  [string]$Keys,
  [ValidateSet('left', 'right', 'middle')][string]$Button = 'left'
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms

Add-Type @"
using System;
using System.Runtime.InteropServices;

public static class NativeInput {
  [DllImport("user32.dll", SetLastError = true)]
  public static extern bool SetCursorPos(int X, int Y);

  [DllImport("user32.dll", SetLastError = true)]
  public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, UIntPtr dwExtraInfo);
}
"@

$MouseMove = 0x0001
$LeftDown = 0x0002
$LeftUp = 0x0004
$RightDown = 0x0008
$RightUp = 0x0010
$MiddleDown = 0x0020
$MiddleUp = 0x0040
$Wheel = 0x0800

function Set-CursorPosition {
  param([int]$PosX, [int]$PosY)
  [void][NativeInput]::SetCursorPos($PosX, $PosY)
}

function Get-ButtonFlags {
  param([string]$MouseButton)

  switch ($MouseButton) {
    'left' { return @{ Down = $LeftDown; Up = $LeftUp } }
    'right' { return @{ Down = $RightDown; Up = $RightUp } }
    'middle' { return @{ Down = $MiddleDown; Up = $MiddleUp } }
    default { throw "Unsupported mouse button: $MouseButton" }
  }
}

function Invoke-MouseClick {
  param([string]$MouseButton, [bool]$DoubleClick)

  $flags = Get-ButtonFlags -MouseButton $MouseButton
  [NativeInput]::mouse_event($flags.Down, 0, 0, 0, [UIntPtr]::Zero)
  [NativeInput]::mouse_event($flags.Up, 0, 0, 0, [UIntPtr]::Zero)

  if ($DoubleClick) {
    Start-Sleep -Milliseconds 80
    [NativeInput]::mouse_event($flags.Down, 0, 0, 0, [UIntPtr]::Zero)
    [NativeInput]::mouse_event($flags.Up, 0, 0, 0, [UIntPtr]::Zero)
  }
}

function Convert-ToSendKeysLiteral {
  param([string]$Value)

  if ($null -eq $Value) {
    return ''
  }

  $builder = New-Object System.Text.StringBuilder

  foreach ($char in $Value.ToCharArray()) {
    switch ($char) {
      '{' { [void]$builder.Append('{{}') }
      '}' { [void]$builder.Append('{}}') }
      '+' { [void]$builder.Append('{+}') }
      '^' { [void]$builder.Append('{^}') }
      '%' { [void]$builder.Append('{%}') }
      '~' { [void]$builder.Append('{~}') }
      '(' { [void]$builder.Append('{(}') }
      ')' { [void]$builder.Append('{)}') }
      '[' { [void]$builder.Append('{[}') }
      ']' { [void]$builder.Append('{]}') }
      "`r" { }
      "`n" { [void]$builder.Append('{ENTER}') }
      default { [void]$builder.Append($char) }
    }
  }

  return $builder.ToString()
}

function Convert-KeyToken {
  param([string]$Token)

  $normalized = $Token.Trim().ToUpperInvariant()

  switch ($normalized) {
    'ENTER' { return '{ENTER}' }
    'TAB' { return '{TAB}' }
    'ESC' { return '{ESC}' }
    'ESCAPE' { return '{ESC}' }
    'SPACE' { return ' ' }
    'UP' { return '{UP}' }
    'DOWN' { return '{DOWN}' }
    'LEFT' { return '{LEFT}' }
    'RIGHT' { return '{RIGHT}' }
    'BACKSPACE' { return '{BACKSPACE}' }
    'DELETE' { return '{DELETE}' }
    'HOME' { return '{HOME}' }
    'END' { return '{END}' }
    'PGUP' { return '{PGUP}' }
    'PGDN' { return '{PGDN}' }
    default {
      if ($normalized -match '^F([1-9]|1[0-2])$') {
        return '{' + $normalized + '}'
      }

      if ($normalized.Length -eq 1) {
        return $normalized.ToLowerInvariant()
      }

      throw "Unsupported key token: $Token"
    }
  }
}

function Convert-ToSendKeysChord {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    throw 'Keys value is required for keypress actions.'
  }

  $tokens = $Value.Split('+', [System.StringSplitOptions]::RemoveEmptyEntries)
  $modifiers = ''
  $mainKey = $null

  foreach ($token in $tokens) {
    $normalized = $token.Trim().ToUpperInvariant()

    switch ($normalized) {
      'CTRL' { $modifiers += '^' }
      'CONTROL' { $modifiers += '^' }
      'ALT' { $modifiers += '%' }
      'SHIFT' { $modifiers += '+' }
      'WIN' { throw 'WIN key chords are not supported in this POC.' }
      'META' { throw 'META key chords are not supported in this POC.' }
      default { $mainKey = Convert-KeyToken -Token $normalized }
    }
  }

  if (-not $mainKey) {
    throw "No non-modifier key found in '$Value'."
  }

  return $modifiers + $mainKey
}

function Invoke-Drag {
  param(
    [int]$FromX,
    [int]$FromY,
    [int]$ToX,
    [int]$ToY,
    [int]$DragDurationMs
  )

  $steps = 12
  $flags = Get-ButtonFlags -MouseButton 'left'

  Set-CursorPosition -PosX $FromX -PosY $FromY
  Start-Sleep -Milliseconds 50
  [NativeInput]::mouse_event($flags.Down, 0, 0, 0, [UIntPtr]::Zero)

  for ($step = 1; $step -le $steps; $step++) {
    $nextX = [int]($FromX + (($ToX - $FromX) * $step / $steps))
    $nextY = [int]($FromY + (($ToY - $FromY) * $step / $steps))
    Set-CursorPosition -PosX $nextX -PosY $nextY
    Start-Sleep -Milliseconds ([Math]::Max([int]($DragDurationMs / $steps), 10))
  }

  [NativeInput]::mouse_event($flags.Up, 0, 0, 0, [UIntPtr]::Zero)
}

switch ($Action.ToLowerInvariant()) {
  'click' {
    Set-CursorPosition -PosX $X -PosY $Y
    Start-Sleep -Milliseconds 60
    Invoke-MouseClick -MouseButton $Button -DoubleClick:$false
  }
  'double_click' {
    Set-CursorPosition -PosX $X -PosY $Y
    Start-Sleep -Milliseconds 60
    Invoke-MouseClick -MouseButton $Button -DoubleClick:$true
  }
  'move' {
    Set-CursorPosition -PosX $X -PosY $Y
  }
  'scroll' {
    if ($PSBoundParameters.ContainsKey('X') -and $PSBoundParameters.ContainsKey('Y')) {
      Set-CursorPosition -PosX $X -PosY $Y
      Start-Sleep -Milliseconds 40
    }
    [NativeInput]::mouse_event($Wheel, 0, 0, [uint32]$DeltaY, [UIntPtr]::Zero)
  }
  'type' {
    [System.Windows.Forms.SendKeys]::SendWait((Convert-ToSendKeysLiteral -Value $Text))
  }
  'keypress' {
    [System.Windows.Forms.SendKeys]::SendWait((Convert-ToSendKeysChord -Value $Keys))
  }
  'drag' {
    Invoke-Drag -FromX $StartX -FromY $StartY -ToX $EndX -ToY $EndY -DragDurationMs $DurationMs
  }
  'wait' {
    Start-Sleep -Milliseconds $DurationMs
  }
  default {
    throw "Unsupported action: $Action"
  }
}

$payload = @{
  action = $Action
  status = 'ok'
  x = $X
  y = $Y
  startX = $StartX
  startY = $StartY
  endX = $EndX
  endY = $EndY
  deltaY = $DeltaY
  durationMs = $DurationMs
}

$payload | ConvertTo-Json -Compress

