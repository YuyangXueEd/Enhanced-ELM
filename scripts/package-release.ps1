param(
  [string]$Version = "0.1.3"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $projectRoot "manifest.json"
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json

if ($manifest.version -ne $Version) {
  throw "manifest.json is version $($manifest.version), not $Version. Update the manifest before packaging."
}

$packageName = "Enhanced-ELM-$Version.zip"
$packagePath = Join-Path $projectRoot $packageName
$candidatePath = Join-Path $projectRoot "Enhanced-ELM-$Version.candidate.zip"
$stagingPath = Join-Path $env:TEMP "enhanced-elm-package-$([guid]::NewGuid().ToString('N'))"

try {
  New-Item -ItemType Directory -Path $stagingPath | Out-Null

  foreach ($item in @("manifest.json", "src", "README.md", "README.zh-CN.md", "LICENSE", "THIRD_PARTY_NOTICES.md")) {
    Copy-Item -LiteralPath (Join-Path $projectRoot $item) -Destination $stagingPath -Recurse
  }

  # The source workspace can retain downloaded reference font files, but the
  # store package deliberately ships only the Mono faces used by the extension.
  $fontDirectory = Join-Path $stagingPath "src/vendor/fonts"
  $releasedFonts = @("CaskaydiaCoveNFM-Regular.ttf", "CaskaydiaCoveNFM-SemiBold.ttf", "LICENSE-Nerd-Fonts.txt")
  Get-ChildItem -LiteralPath $fontDirectory -File |
    Where-Object { $_.Name -notin $releasedFonts } |
    Remove-Item -Force

  $assetDestination = Join-Path $stagingPath "assets"
  New-Item -ItemType Directory -Path $assetDestination | Out-Null
  Get-ChildItem -LiteralPath (Join-Path $projectRoot "assets") -File -Filter "icon-*.png" |
    Copy-Item -Destination $assetDestination

  if (Test-Path -LiteralPath $candidatePath) {
    Remove-Item -LiteralPath $candidatePath -Force
  }
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  # includeBaseDirectory is false so stores receive manifest.json at the ZIP
  # root rather than an extra staging-directory layer.
  [System.IO.Compression.ZipFile]::CreateFromDirectory(
    $stagingPath,
    $candidatePath,
    [System.IO.Compression.CompressionLevel]::Optimal,
    $false
  )

  $archive = [System.IO.Compression.ZipFile]::OpenRead($candidatePath)
  try {
    # Windows ZIP APIs may expose entry paths with backslashes; normalise them
    # before validating the cross-platform store layout.
    $entries = @($archive.Entries | ForEach-Object { $_.FullName -replace '\\', '/' })
    foreach ($required in @("manifest.json", "src/content.js", "src/core/local-fonts.js", "src/vendor/fonts/CaskaydiaCoveNFM-Regular.ttf", "assets/icon-128.png", "LICENSE", "THIRD_PARTY_NOTICES.md")) {
      if ($entries -notcontains $required) {
        throw "Release package is missing $required"
      }
    }
    if ($entries | Where-Object { $_ -match '^Enhanced-ELM/' }) {
      throw "Release package must place manifest.json at the ZIP root."
    }
    if ($entries | Where-Object { $_ -match '^src/vendor/fonts/(?:CaskaydiaCoveNFP|Nowar|LICENSE-Nowar)' }) {
      throw "Release package must not include unused proportional or CJK font files."
    }
  } finally {
    $archive.Dispose()
  }

  Copy-Item -LiteralPath $candidatePath -Destination $packagePath -Force
  $size = (Get-Item -LiteralPath $packagePath).Length
  Write-Host "Created and validated $packageName ($size bytes)."
} finally {
  if (Test-Path -LiteralPath $candidatePath) {
    Remove-Item -LiteralPath $candidatePath -Force
  }
  if (Test-Path -LiteralPath $stagingPath) {
    Remove-Item -LiteralPath $stagingPath -Recurse -Force
  }
}
