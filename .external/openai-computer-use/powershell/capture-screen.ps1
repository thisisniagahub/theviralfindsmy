param(
  [ValidateSet('temp', 'path')][string]$Mode = 'temp',
  [string]$Path,
  [switch]$ActiveWindow
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class NativeWindowInfo {
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT {
    public int Left;
    public int Top;
    public int Right;
    public int Bottom;
  }

  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();

  [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

  [DllImport("user32.dll", SetLastError = true)]
  [return: MarshalAs(UnmanagedType.Bool)]
  public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
}
"@

function Get-ResolvedPath {
  param([string]$Mode, [string]$Path)

  if ($Mode -eq 'path' -and $Path) {
    $directory = Split-Path -Parent $Path
    if ($directory) {
      New-Item -ItemType Directory -Force -Path $directory | Out-Null
    }
    return [System.IO.Path]::GetFullPath($Path)
  }

  $tempDir = Join-Path $env:TEMP 'openai-computer-use'
  New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
  $fileName = 'screen-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff') + '.png'
  return Join-Path $tempDir $fileName
}

function Get-WindowMetadata {
  $handle = [NativeWindowInfo]::GetForegroundWindow()
  if ($handle -eq [IntPtr]::Zero) {
    return $null
  }

  $titleBuilder = New-Object System.Text.StringBuilder 512
  [void][NativeWindowInfo]::GetWindowText($handle, $titleBuilder, $titleBuilder.Capacity)

  $rect = New-Object NativeWindowInfo+RECT
  $success = [NativeWindowInfo]::GetWindowRect($handle, [ref]$rect)
  if (-not $success) {
    return $null
  }

  $width = $rect.Right - $rect.Left
  $height = $rect.Bottom - $rect.Top

  if ($width -le 0 -or $height -le 0) {
    return $null
  }

  return @{
    Title = $titleBuilder.ToString()
    X = $rect.Left
    Y = $rect.Top
    Width = $width
    Height = $height
  }
}

$resolvedPath = Get-ResolvedPath -Mode $Mode -Path $Path
$windowInfo = $null

if ($ActiveWindow) {
  $windowInfo = Get-WindowMetadata
}

if ($windowInfo) {
  $bounds = New-Object System.Drawing.Rectangle($windowInfo.X, $windowInfo.Y, $windowInfo.Width, $windowInfo.Height)
} else {
  $virtualScreen = [System.Windows.Forms.SystemInformation]::VirtualScreen
  $bounds = New-Object System.Drawing.Rectangle($virtualScreen.X, $virtualScreen.Y, $virtualScreen.Width, $virtualScreen.Height)
}

$bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

try {
  $graphics.CopyFromScreen($bounds.X, $bounds.Y, 0, 0, $bitmap.Size)
  $bitmap.Save($resolvedPath, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $graphics.Dispose()
  $bitmap.Dispose()
}

$payload = @{
  path = $resolvedPath
  x = $bounds.X
  y = $bounds.Y
  width = $bounds.Width
  height = $bounds.Height
  windowTitle = if ($windowInfo) { $windowInfo.Title } else { '' }
}

$payload | ConvertTo-Json -Compress

