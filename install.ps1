<#
.SYNOPSIS
  Skallywag installer for Windows.
  One-liner:  irm https://raw.githubusercontent.com/Moonwolf711/skallywag/main/install.ps1 | iex

.DESCRIPTION
  Installs Node.js LTS and Ollama (winget) if missing, downloads this repo, copies the free
  Skallywag Lite device into the Ableton User Library, installs the Claude Code channel agents
  and template skill when Claude Code is present, pulls the local model, and optionally unpacks
  a purchased Skallywag bundle and runs its setup.

  Options are read from environment variables so they also work with the one-liner:
    SKALLYWAG_DRYRUN=1        print every step, change nothing
    SKALLYWAG_SKIP_MODEL=1    do not pull the Ollama model
    SKALLYWAG_SKIP_SKILLS=1   do not touch ~/.claude
    SKALLYWAG_MODEL=<name>    Ollama model to pull (default qwen2.5:7b)
    SKALLYWAG_ZIP=<path>      purchased Skallywag.zip to unpack + set up
  When run as a file the same options exist as parameters: -DryRun -SkipModel -SkipSkills -Model -Zip
#>
[CmdletBinding()]
param(
  [switch]$DryRun,
  [switch]$SkipModel,
  [switch]$SkipSkills,
  [string]$Model = "",
  [string]$Zip = "",
  [string]$Repo = "Moonwolf711/skallywag",
  [string]$Branch = "main"
)
$ErrorActionPreference = "Stop"
if ($env:SKALLYWAG_DRYRUN -eq "1") { $DryRun = $true }
if ($env:SKALLYWAG_SKIP_MODEL -eq "1") { $SkipModel = $true }
if ($env:SKALLYWAG_SKIP_SKILLS -eq "1") { $SkipSkills = $true }
if (-not $Model) { $Model = if ($env:SKALLYWAG_MODEL) { $env:SKALLYWAG_MODEL } else { "qwen2.5:7b" } }
if (-not $Zip -and $env:SKALLYWAG_ZIP) { $Zip = $env:SKALLYWAG_ZIP }

function Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Note($msg) { Write-Host "    $msg" -ForegroundColor DarkGray }
function Run($desc, [scriptblock]$block) {
  if ($DryRun) { Write-Host "    [dry-run] $desc" -ForegroundColor Yellow; return }
  & $block
}
function Have($cmd) { return [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }

Write-Host ""
Write-Host "  SKALLYWAG  -  an AI first mate inside Ableton Live" -ForegroundColor White
Write-Host "  The captain doesn't steer the ship. The crew does." -ForegroundColor DarkGray
Write-Host ""
if ($DryRun) { Write-Host "  DRY RUN: nothing will be installed or copied." -ForegroundColor Yellow }

# 1. dependencies ---------------------------------------------------------------
Step "Dependencies"
if (-not (Have "winget")) {
  Write-Warning "winget is not available. Install Node.js LTS (https://nodejs.org) and Ollama (https://ollama.com/download/windows) by hand, then rerun."
  if (-not $DryRun) { exit 1 }
}
if (Have "node") { Note "Node.js $(node --version) found" }
else { Run "winget install OpenJS.NodeJS.LTS" { winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements | Out-Null; Note "Node.js installed (open a new terminal if 'node' is not found yet)" } }
if (Have "ollama") { Note "Ollama found" }
else { Run "winget install Ollama.Ollama" { winget install -e --id Ollama.Ollama --accept-source-agreements --accept-package-agreements | Out-Null; Note "Ollama installed" } }

# 2. fetch this repo --------------------------------------------------------------
Step "Skallywag files"
$base = Join-Path $env:LOCALAPPDATA "Skallywag"
$src = Join-Path $base "public"
$zipUrl = "https://github.com/$Repo/archive/refs/heads/$Branch.zip"
Run "download $zipUrl -> $src" {
  New-Item -ItemType Directory -Force -Path $base | Out-Null
  $tmp = Join-Path $base "repo.zip"
  Invoke-WebRequest -Uri $zipUrl -OutFile $tmp -UseBasicParsing
  if (Test-Path $src) { Remove-Item -Recurse -Force $src }
  $extract = Join-Path $base "extract"
  if (Test-Path $extract) { Remove-Item -Recurse -Force $extract }
  Expand-Archive -Path $tmp -DestinationPath $extract -Force
  $inner = Get-ChildItem $extract | Select-Object -First 1
  Move-Item $inner.FullName $src
  Remove-Item -Recurse -Force $extract; Remove-Item -Force $tmp
}
Note "repo files: $src"

# 3. Skallywag Lite device --------------------------------------------------------
Step "Skallywag Lite device"
$userLib = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "Ableton\User Library"
$liteDst = Join-Path $userLib "Presets\Audio Effects\Max Audio Effect\Skallywag Lite"
if (Test-Path $userLib) {
  Run "copy device-lite -> $liteDst" {
    New-Item -ItemType Directory -Force -Path $liteDst | Out-Null
    Copy-Item (Join-Path $src "device-lite\*") $liteDst -Force
  }
  Note "in Live: User Library > Presets > Audio Effects > Max Audio Effect > Skallywag Lite"
} else {
  Write-Warning "Ableton User Library not found at $userLib. Copy the device-lite folder there yourself: $src\device-lite"
}

# 4. Claude Code agents + skill ---------------------------------------------------
Step "Claude Code channel agents + template skill"
if ($SkipSkills) { Note "skipped (SKALLYWAG_SKIP_SKILLS)" }
elseif (-not (Have "claude") -and -not (Test-Path (Join-Path $HOME ".claude"))) { Note "Claude Code not found; skipping. Files stay in $src\claude" }
else {
  $agentsDst = Join-Path $HOME ".claude\agents"
  $skillDst = Join-Path $HOME ".claude\skills\skallywag-template"
  Run "copy claude\agents\track-*.md -> $agentsDst" { New-Item -ItemType Directory -Force -Path $agentsDst | Out-Null; Copy-Item (Join-Path $src "claude\agents\*.md") $agentsDst -Force }
  Run "copy claude\skills\skallywag-template -> $skillDst" { New-Item -ItemType Directory -Force -Path $skillDst | Out-Null; Copy-Item (Join-Path $src "claude\skills\skallywag-template\*") $skillDst -Recurse -Force }
  Run "copy tools\osc.py -> $base\tools\osc.py" { New-Item -ItemType Directory -Force -Path (Join-Path $base "tools") | Out-Null; Copy-Item (Join-Path $src "tools\osc.py") (Join-Path $base "tools\osc.py") -Force }
  Note "agents reference tools/osc.py; the copy is at $base\tools\osc.py"
}

# 5. local model ------------------------------------------------------------------
Step "Local model ($Model)"
if ($SkipModel) { Note "skipped (SKALLYWAG_SKIP_MODEL)" }
elseif (-not (Have "ollama") -and -not $DryRun) { Write-Warning "ollama not on PATH yet; open a new terminal and run: ollama pull $Model" }
else { Run "ollama pull $Model  (one-time download, several GB)" { ollama pull $Model } }

# 6. purchased bundle -------------------------------------------------------------
Step "Skallywag bundle"
if (-not $Zip) { Note "no bundle given. Bought Skallywag? rerun with SKALLYWAG_ZIP=<path to Skallywag.zip> (or -Zip). Get it: https://4420607908526.gumroad.com/l/skallywag" }
elseif (-not (Test-Path $Zip)) { Write-Warning "bundle not found: $Zip" }
else {
  $dst = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "Skallywag"
  Run "unpack $Zip -> $dst and run setup.bat" {
    Expand-Archive -Path $Zip -DestinationPath $dst -Force
    $setup = Get-ChildItem -Path $dst -Filter setup.bat -Recurse | Select-Object -First 1
    if ($setup) { Push-Location $setup.DirectoryName; cmd /c setup.bat; Pop-Location } else { Write-Warning "setup.bat not found inside the bundle" }
  }
  Note "then: run.bat, and drag device\Skallywag.amxd onto a MIDI track"
}

Write-Host ""
Write-Host "  Done." -ForegroundColor Green
Write-Host "  Say it exactly. It's in the set." -ForegroundColor DarkGray
Write-Host ""
