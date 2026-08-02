[CmdletBinding()]
param(
    [string]$Ref = $(if ($env:BASEKIT_REF) { $env:BASEKIT_REF } else { 'main' }),
    [string]$InstallRoot = $(if ($env:BASEKIT_HOME) { $env:BASEKIT_HOME } else { Join-Path $env:LOCALAPPDATA 'BaseKit' }),
    [string]$SourceDir = $env:BASEKIT_SOURCE_DIR,
    [switch]$NoPathUpdate
)

$ErrorActionPreference = 'Stop'
$repository = if ($env:BASEKIT_REPOSITORY) { $env:BASEKIT_REPOSITORY } else { 'dat-hoangnguyentuandat/basekit' }
$tempDir = $null
$resolvedCommit = $env:BASEKIT_COMMIT

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js 18 or newer is required.'
}
$nodeMajor = [int]((& node -p "process.versions.node.split('.')[0]").Trim())
if ($nodeMajor -lt 18) { throw 'Node.js 18 or newer is required.' }

try {
    if (-not $SourceDir) {
        if (-not $resolvedCommit) {
            try {
                $commitInfo = Invoke-RestMethod "https://api.github.com/repos/$repository/commits/$Ref" -Headers @{
                    Accept = 'application/vnd.github+json'
                    'X-GitHub-Api-Version' = '2022-11-28'
                    'User-Agent' = 'basekit-installer'
                }
                $resolvedCommit = $commitInfo.sha
            } catch {
                Write-Host "Could not resolve the current commit; installing ref '$Ref'." -ForegroundColor Yellow
            }
        }
        $tempDir = Join-Path ([IO.Path]::GetTempPath()) "basekit-$([guid]::NewGuid())"
        New-Item -ItemType Directory -Path $tempDir | Out-Null
        $archive = Join-Path $tempDir 'basekit.zip'
        $downloadRef = if ($resolvedCommit) { $resolvedCommit } else { $Ref }
        Invoke-WebRequest "https://github.com/$repository/archive/$downloadRef.zip" -OutFile $archive
        Expand-Archive $archive -DestinationPath $tempDir
        $SourceDir = (Get-ChildItem $tempDir -Directory | Select-Object -First 1).FullName
    } elseif (-not $resolvedCommit -and (Get-Command git -ErrorAction SilentlyContinue)) {
        $resolvedCommit = (& git -C $SourceDir rev-parse HEAD 2>$null)
    }

    New-Item -ItemType Directory -Force -Path $InstallRoot | Out-Null
    $appDir = Join-Path $InstallRoot 'app'
    $stagedApp = Join-Path $InstallRoot "app.new.$PID"
    $previousApp = Join-Path $InstallRoot 'app.previous'
    Copy-Item -Recurse -Force -Path $SourceDir -Destination $stagedApp
    if (Test-Path $previousApp) { Remove-Item -Recurse -Force -LiteralPath $previousApp }
    if (Test-Path $appDir) { Move-Item -LiteralPath $appDir -Destination $previousApp }
    Move-Item -LiteralPath $stagedApp -Destination $appDir

    $metadataArgs = @(
        (Join-Path $appDir 'installer\write-release-metadata.mjs'),
        '--app', $appDir,
        '--repository', $repository,
        '--ref', $Ref,
        '--version', '1.1.0'
    )
    if ($resolvedCommit) { $metadataArgs += @('--commit', $resolvedCommit.Trim()) }
    & node @metadataArgs
    if ($LASTEXITCODE -ne 0) { throw "Could not record BaseKit release metadata (exit $LASTEXITCODE)." }

    $binDir = Join-Path $InstallRoot 'bin'
    New-Item -ItemType Directory -Force -Path $binDir | Out-Null
    $launcher = Join-Path $appDir 'bin\basekit.mjs'
    $cmd = "@echo off`r`nnode `"$launcher`" %*`r`n"
    Set-Content -Path (Join-Path $binDir 'basekit.cmd') -Value $cmd -Encoding ascii -NoNewline

    if (-not $NoPathUpdate) {
        $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
        $parts = @($userPath -split ';' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
        if ($parts -notcontains $binDir) {
            [Environment]::SetEnvironmentVariable('Path', (($parts + $binDir) -join ';'), 'User')
        }
        if (($env:Path -split ';') -notcontains $binDir) { $env:Path = "$env:Path;$binDir" }
    }

    Write-Host "BaseKit launcher installed at $(Join-Path $binDir 'basekit.cmd')" -ForegroundColor Green
    Write-Host 'Open a new terminal, enter a project directory, and run: basekit' -ForegroundColor Green
} finally {
    if ($tempDir -and (Test-Path $tempDir)) { Remove-Item -Recurse -Force -LiteralPath $tempDir }
}
