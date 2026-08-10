$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $projectRoot "store-assets"
$iconPath = Join-Path $projectRoot "assets/icon-128.png"
$generatedArtworkPath = Join-Path $outputPath "generated-promo-art-v1.png"

Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $outputPath | Out-Null

function New-PromoTile {
  param(
    [Parameter(Mandatory)] [int]$Width,
    [Parameter(Mandatory)] [int]$Height,
    [Parameter(Mandatory)] [string]$Path
  )

  $bitmap = [System.Drawing.Bitmap]::new($Width, $Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $icon = [System.Drawing.Image]::FromFile($iconPath)

  try {
    $canvas = [System.Drawing.Color]::FromArgb(244, 246, 244)
    $ink = [System.Drawing.Color]::FromArgb(23, 35, 31)
    $muted = [System.Drawing.Color]::FromArgb(95, 107, 101)
    $accent = [System.Drawing.Color]::FromArgb(31, 92, 75)
    $accentSoft = [System.Drawing.Color]::FromArgb(226, 239, 232)
    $graphics.Clear($canvas)

    $graphics.FillRectangle([System.Drawing.SolidBrush]::new($accent), 0, 0, [int]($Width * 0.018), $Height)
    $graphics.FillEllipse([System.Drawing.SolidBrush]::new($accentSoft), [int]($Width * 0.72), [int](-$Height * 0.36), [int]($Width * 0.46), [int]($Height * 0.95))
    $graphics.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(210, 231, 219)), [int]($Width * 0.80), [int]($Height * 0.53), [int]($Width * 0.30), [int]($Height * 0.55))

    $scale = [Math]::Min($Width / 1400.0, $Height / 560.0)
    $iconSize = [int](112 * $scale)
    $left = [int](112 * $scale)
    $top = [int](88 * $scale)
    $graphics.DrawImage($icon, [System.Drawing.Rectangle]::new($left, $top, $iconSize, $iconSize))

    $titleFont = [System.Drawing.Font]::new("Segoe UI Semibold", [single](68 * $scale), [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $bodyFont = [System.Drawing.Font]::new("Segoe UI", [single](29 * $scale), [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $chipFont = [System.Drawing.Font]::new("Segoe UI Semibold", [single](21 * $scale), [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    try {
      $textLeft = $left + $iconSize + [int](28 * $scale)
      $graphics.DrawString("Enhanced ELM", $titleFont, [System.Drawing.SolidBrush]::new($ink), $textLeft, [int](99 * $scale))
      $graphics.DrawString("A focused, local-first workspace for ELM New look", $bodyFont, [System.Drawing.SolidBrush]::new($muted), $textLeft, [int](184 * $scale))

      $chipY = [int](314 * $scale)
      $chipX = $left
      foreach ($label in @("Compact workspace", "Local-first", "Markdown & Math")) {
        $size = $graphics.MeasureString($label, $chipFont)
        $chipWidth = [int]([Math]::Ceiling($size.Width) + 36 * $scale)
        $chipHeight = [int](42 * $scale)
        $graphics.FillRectangle([System.Drawing.SolidBrush]::new($accentSoft), $chipX, $chipY, $chipWidth, $chipHeight)
        $graphics.DrawString($label, $chipFont, [System.Drawing.SolidBrush]::new($accent), $chipX + [int](18 * $scale), $chipY + [int](8 * $scale))
        $chipX += $chipWidth + [int](12 * $scale)
      }
    } finally {
      $titleFont.Dispose()
      $bodyFont.Dispose()
      $chipFont.Dispose()
    }

    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $icon.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

function New-ImageGenPromoTile {
  param(
    [Parameter(Mandatory)] [int]$Width,
    [Parameter(Mandatory)] [int]$Height,
    [Parameter(Mandatory)] [string]$Path,
    [Parameter(Mandatory)] [bool]$IncludeCopy
  )

  if (-not (Test-Path -LiteralPath $generatedArtworkPath)) {
    throw "ImageGen artwork not found: $generatedArtworkPath"
  }

  $bitmap = [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $artwork = [System.Drawing.Image]::FromFile($generatedArtworkPath)
  $icon = [System.Drawing.Image]::FromFile($iconPath)
  try {
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    # Wide artwork is already composed for the marquee; for the small tile, crop into
    # the right-hand visual region rather than shrinking the entire composition.
    $destinationRatio = $Width / [double]$Height
    $sourceRatio = $artwork.Width / [double]$artwork.Height
    if ($sourceRatio -gt $destinationRatio) {
      $cropWidth = [int]([Math]::Round($artwork.Height * $destinationRatio))
      # Offset the branded small tile toward the artwork cluster. The opaque title panel
      # preserves a calm reading area on the left while the right third stays visually rich.
      $cropX = if ($IncludeCopy) { [int]([Math]::Max(0, $artwork.Width - $cropWidth - 380)) } else { $artwork.Width - $cropWidth }
      $sourceRect = [System.Drawing.Rectangle]::new($cropX, 0, $cropWidth, $artwork.Height)
    } else {
      $cropHeight = [int]([Math]::Round($artwork.Width / $destinationRatio))
      $cropY = [int](($artwork.Height - $cropHeight) / 2)
      $sourceRect = [System.Drawing.Rectangle]::new(0, $cropY, $artwork.Width, $cropHeight)
    }
    $graphics.DrawImage($artwork, [System.Drawing.Rectangle]::new(0, 0, $Width, $Height), $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)

    if ($IncludeCopy) {
      $leftPanelWidth = [int]($Width * 0.58)
      $panelBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(222, 250, 248, 242))
      $graphics.FillRectangle($panelBrush, 0, 0, $leftPanelWidth, $Height)
      $panelBrush.Dispose()

      $ink = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(20, 43, 35))
      $muted = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(65, 92, 82))
      try {
        if ($Width -le 500) {
          # The small dashboard tile needs a vertical lock-up: a normal marquee
          # layout makes both the icon and the product name too small to recognise.
          $iconSize = 46
          $left = 28
          $graphics.DrawImage($icon, [System.Drawing.Rectangle]::new($left, 32, $iconSize, $iconSize))

          $titleFont = [System.Drawing.Font]::new("Segoe UI Semibold", 22, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
          $bodyFont = [System.Drawing.Font]::new("Segoe UI", 11, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
          try {
            $graphics.DrawString("Enhanced ELM", $titleFont, $ink, $left, 95)
            $graphics.DrawString("ELM New look, refined", $bodyFont, $muted, $left, 133)
          } finally {
            $titleFont.Dispose()
            $bodyFont.Dispose()
          }
        } else {
          $scale = $Width / 1400.0
          $iconSize = [int](92 * $scale)
          $left = [int](92 * $scale)
          $top = [int](106 * $scale)
          $graphics.DrawImage($icon, [System.Drawing.Rectangle]::new($left, $top, $iconSize, $iconSize))

          $titleFont = [System.Drawing.Font]::new("Segoe UI Semibold", [single](58 * $scale), [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
          $bodyFont = [System.Drawing.Font]::new("Segoe UI", [single](25 * $scale), [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
          try {
            $textLeft = $left + $iconSize + [int](22 * $scale)
            $graphics.DrawString("Enhanced ELM", $titleFont, $ink, $textLeft, [int](116 * $scale))
            $graphics.DrawString("A focused workspace for ELM New look", $bodyFont, $muted, $left, [int](234 * $scale))
          } finally {
            $titleFont.Dispose()
            $bodyFont.Dispose()
          }
        }
      } finally {
        $ink.Dispose()
        $muted.Dispose()
      }
    }

    # Explicit RGB pixel format keeps the output compliant with the 24-bit PNG upload requirement.
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $icon.Dispose()
    $artwork.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

New-PromoTile -Width 440 -Height 280 -Path (Join-Path $outputPath "promo-small-440x280.png")
New-PromoTile -Width 1400 -Height 560 -Path (Join-Path $outputPath "promo-marquee-1400x560.png")
if (Test-Path -LiteralPath $generatedArtworkPath) {
  New-ImageGenPromoTile -Width 440 -Height 280 -Path (Join-Path $outputPath "promo-small-440x280-v2.png") -IncludeCopy $true
  New-ImageGenPromoTile -Width 1400 -Height 560 -Path (Join-Path $outputPath "promo-marquee-1400x560-v2.png") -IncludeCopy $true
}
Write-Host "Created store promo assets in $outputPath"
