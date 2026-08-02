[CmdletBinding()]
param(
    [ValidateSet('claude', 'codex', 'both')]
    [string]$Provider = $env:BASEKIT_PROVIDER,
    [string]$Target = $(if ($env:BASEKIT_TARGET) { $env:BASEKIT_TARGET } else { (Get-Location).Path }),
    [string]$Ref = $(if ($env:BASEKIT_REF) { $env:BASEKIT_REF } else { 'main' })
)

$ErrorActionPreference = 'Stop'
$repository = if ($env:BASEKIT_REPOSITORY) { $env:BASEKIT_REPOSITORY } else { 'dat-hoangnguyentuandat/basekit' }
$sourceDir = $env:BASEKIT_SOURCE_DIR
$tempDir = $null

if (-not $Provider) {
    Write-Host "BaseKit target: $Target"
    Write-Host '1) Claude Code'
    Write-Host '2) Codex'
    Write-Host '3) Both'
    $choice = Read-Host 'Choose a provider [1-3]'
    $Provider = switch ($choice) {
        '1' { 'claude' }
        '2' { 'codex' }
        '3' { 'both' }
        default { throw "Invalid provider selection: $choice" }
    }
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js 18 or newer is required to install BaseKit safely.'
}

try {
    if (-not $sourceDir) {
        $tempDir = Join-Path ([IO.Path]::GetTempPath()) "basekit-$([guid]::NewGuid())"
        New-Item -ItemType Directory -Path $tempDir | Out-Null
        $archive = Join-Path $tempDir 'basekit.zip'
        Invoke-WebRequest "https://github.com/$repository/archive/refs/heads/$Ref.zip" -OutFile $archive
        Expand-Archive $archive -DestinationPath $tempDir
        $sourceDir = (Get-ChildItem $tempDir -Directory | Select-Object -First 1).FullName
    }
    New-Item -ItemType Directory -Force -Path $Target | Out-Null
    & node (Join-Path $sourceDir 'installer/install.mjs') --source $sourceDir --target $Target --provider $Provider
    if ($LASTEXITCODE -ne 0) { throw "BaseKit installer exited with code $LASTEXITCODE" }
    Write-Host "BaseKit installed for $Provider in $Target"
} finally {
    if ($tempDir -and (Test-Path $tempDir)) { Remove-Item -Recurse -Force -LiteralPath $tempDir }
}
