<#
============================================================
  thirty-a-day-chart.ps1
  "The inputs are linear. The outcome is not."
============================================================
  One-off PNG export for the Bitcoin Exit essay, and the seed
  for the backlog's "What Daily Conviction Bought" tool.

  Simulates buying $30 of BTC every day from 2017-01-01 through
  the latest sample in the canonical Power Law series, using
  log-linear interpolation between the ~12-day samples to get a
  daily price. Prints the reconciliation numbers, then renders
  a 1600x900 PNG (plus @2x) with the site palette.

  Data source (single source of truth):
    src/_includes/_pageassets/shared/power-law-data.js  (PL_DATA)
    GENESIS_TS = 1230940800  (2009-01-03 00:00:00 UTC)

  No node/python on this box by design (see project memory), so
  the whole thing is PowerShell 5.1 + System.Drawing (GDI+).
  Fonts: Inter/Cormorant are not installed locally; we substitute
  Segoe UI (for Inter, body/labels) and Georgia (for Cormorant,
  the serif display title) to mirror the site's serif+sans pairing.

  Usage:
    powershell -ExecutionPolicy Bypass -File scripts/thirty-a-day-chart.ps1 -OutDir <dir>
============================================================
#>
[CmdletBinding()]
param(
  [double]$Daily = 30.0,
  [string]$StartDate = '2017-01-01',
  [string]$DataFile = "$PSScriptRoot/../src/_includes/_pageassets/shared/power-law-data.js",
  [string]$OutDir = "$PSScriptRoot/../"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

# ---- constants mirrored from power-law-data.js -------------------------------
$GENESIS_TS = 1230940800                       # 2009-01-03 00:00:00 UTC (seconds)
$Genesis    = [datetime]::new(1970,1,1,0,0,0,[DateTimeKind]::Utc).AddSeconds($GENESIS_TS)

# ---- parse PL_DATA -----------------------------------------------------------
$raw = Get-Content -LiteralPath $DataFile -Raw
$m = [regex]::Match($raw, 'var\s+PL_DATA\s*=\s*(\[.*?\]);', 'Singleline')
if (-not $m.Success) { throw "Could not locate PL_DATA in $DataFile" }
$pairs = [regex]::Matches($m.Groups[1].Value, '\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]')
$samples = New-Object System.Collections.Generic.List[object]
foreach ($p in $pairs) {
  $samples.Add([pscustomobject]@{
    Day   = [double]$p.Groups[1].Value
    Price = [double]$p.Groups[2].Value
  })
}
$samples = $samples | Sort-Object Day
$sDay  = [double[]]($samples | ForEach-Object Day)
$sPx   = [double[]]($samples | ForEach-Object Price)
$nS    = $sDay.Count
$firstSampleDay = $sDay[0]
$lastSampleDay  = $sDay[$nS-1]
$lastSamplePrice = $sPx[$nS-1]

# ---- day <-> date helpers ----------------------------------------------------
function DayToDate([double]$d) { return $Genesis.AddDays($d) }
function DateToDay([datetime]$dt) {
  return [math]::Floor(($dt.ToUniversalTime() - $Genesis).TotalDays)
}

$startDt  = [datetime]::SpecifyKind([datetime]::ParseExact($StartDate,'yyyy-MM-dd',$null),[DateTimeKind]::Utc)
$startDay = [int](DateToDay $startDt)
$endDay   = [int]$lastSampleDay
if ($startDay -lt $firstSampleDay) { throw "Start date precedes first PL_DATA sample." }

# ---- log-linear daily price interpolation ------------------------------------
# price(d) = exp( ln(p0) + (ln(p1)-ln(p0)) * (d-d0)/(d1-d0) )
function PriceOnDay([double]$d) {
  if ($d -le $script:firstSampleDay) { return $script:sPx[0] }
  if ($d -ge $script:lastSampleDay)  { return $script:sPx[$script:nS-1] }
  # binary search for bracketing samples
  $lo = 0; $hi = $script:nS - 1
  while ($hi - $lo -gt 1) {
    $mid = [int](($lo + $hi) / 2)
    if ($script:sDay[$mid] -le $d) { $lo = $mid } else { $hi = $mid }
  }
  $d0 = $script:sDay[$lo]; $d1 = $script:sDay[$hi]
  $p0 = $script:sPx[$lo];  $p1 = $script:sPx[$hi]
  $t  = ($d - $d0) / ($d1 - $d0)
  $ln = [math]::Log($p0) + ($t * ([math]::Log($p1) - [math]::Log($p0)))
  return [math]::Exp($ln)
}

# ---- simulate ----------------------------------------------------------------
$series = New-Object System.Collections.Generic.List[object]
$cumBtc = 0.0
$contrib = 0.0
$peak = 0.0
$maxDD = 0.0            # most-negative drawdown (fraction, <= 0)
$ddDay = $startDay; $ddVal = 0.0; $ddPeak = 0.0
$crossDay = $null; $crossContrib = 0.0; $crossBtc = 0.0; $crossPrice = 0.0

for ($d = $startDay; $d -le $endDay; $d++) {
  $px = PriceOnDay ([double]$d)
  $cumBtc  += $Daily / $px
  $contrib += $Daily
  $val = $cumBtc * $px
  if ($val -gt $peak) { $peak = $val }
  $dd = if ($peak -gt 0) { ($val / $peak) - 1.0 } else { 0.0 }
  if ($dd -lt $maxDD) { $maxDD = $dd; $ddDay = $d; $ddVal = $val; $ddPeak = $peak }
  if ($null -eq $crossDay -and $val -ge 1000000.0) {
    $crossDay = $d; $crossContrib = $contrib; $crossBtc = $cumBtc; $crossPrice = $px
  }
  $series.Add([pscustomobject]@{ Day=$d; Contrib=$contrib; Value=$val })
}

$finalVal    = $series[$series.Count-1].Value
$finalContrib= $contrib
$finalBtc    = $cumBtc
$totalDays   = $series.Count

# ---- duration helper (y/m/d from start to a date) ----------------------------
function DurationYMD([datetime]$a,[datetime]$b) {
  $y = $b.Year - $a.Year; $mo = $b.Month - $a.Month; $dd = $b.Day - $a.Day
  if ($dd -lt 0) { $mo--; $dd += [datetime]::DaysInMonth($b.AddMonths(-1).Year, $b.AddMonths(-1).Month) }
  if ($mo -lt 0) { $y--; $mo += 12 }
  return "{0}y{1}m{2}d" -f $y,$mo,$dd
}

# ---- PRINT FIRST -------------------------------------------------------------
$fmtUSD = { param($v) '{0:C0}' -f [double]$v }
""
"============================================================"
"  `$$Daily A DAY - $($startDt.ToString('yyyy-MM-dd')) -> $((DayToDate $lastSampleDay).ToString('yyyy-MM-dd'))"
"  computed from PL_DATA ($nS samples, log-linear daily interp)"
"============================================================"
"Days simulated ............... {0:N0}  ({1} through {2})" -f $totalDays, $startDt.ToString('yyyy-MM-dd'), (DayToDate $lastSampleDay).ToString('yyyy-MM-dd')
""
if ($null -ne $crossDay) {
  $crossDt = DayToDate $crossDay
  "FIRST crossed `$1,000,000 stack value:"
  "  Date ....................... {0}" -f $crossDt.ToString('yyyy-MM-dd')
  "  Time from start ............ {0}" -f (DurationYMD $startDt $crossDt)
  "  Cumulative inputs at cross . {0:N0}  (`$$Daily x {1:N0} days)" -f $crossContrib, (($crossDay - $startDay)+1)
  "  BTC held at crossing ....... {0:N6} BTC" -f $crossBtc
  "  BTC spot at crossing ....... {0:N0}" -f $crossPrice
} else {
  "Stack value NEVER crossed `$1,000,000 in this window."
}
""
"AS OF LATEST SAMPLE ({0}):" -f (DayToDate $lastSampleDay).ToString('yyyy-MM-dd')
"  Total BTC accumulated ...... {0:N6} BTC" -f $finalBtc
"  Cumulative inputs to date .. {0:N0}" -f $finalContrib
"  Stack value ................ {0:N0}" -f $finalVal
"  Multiple on inputs ......... {0:N2}x" -f ($finalVal / $finalContrib)
"  BTC spot (latest sample) ... {0:N0}" -f $lastSamplePrice
""
$ddDt = DayToDate $ddDay
"DEEPEST DRAWDOWN on the stack-value line:"
"  Depth ...................... {0:P1}" -f $maxDD
"  Date (trough) .............. {0}" -f $ddDt.ToString('yyyy-MM-dd')
"  Value at trough ............ {0:N0}  (peak had been {1:N0})" -f $ddVal, $ddPeak
""
"RECONCILE vs the widely-reported legend (`$86,370 in / 7y10m12d to `$1M):"
if ($null -ne $crossDay) {
  "  Our recompute: {0:N0} in / {1} to `$1M." -f $crossContrib, (DurationYMD $startDt (DayToDate $crossDay))
  "  Delta on inputs: {0:N0} vs 86,370  ->  {1:+0;-0} dollars, {2:+0.0;-0.0}%." -f `
      $crossContrib, ($crossContrib-86370), ((($crossContrib-86370)/86370)*100)
} else {
  "  No crossing in-window; legend not reproducible from this series."
}
"============================================================"
""

# ============================================================
#  RENDER
# ============================================================
function New-Chart {
  param([double]$Scale, [string]$Path)

  $W = [int](1600 * $Scale); $H = [int](900 * $Scale)
  $bmp = New-Object System.Drawing.Bitmap($W, $H)
  $bmp.SetResolution(96.0 * $Scale, 96.0 * $Scale)  # keep point-sized fonts scaling with the canvas
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias  # grayscale AA (no ClearType fringing on dark)
  $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  # scale helper: everything authored in 1600x900 space
  $S = { param($v) [single]($v * $Scale) }

  # ---- palette (STYLE_GUIDE §3) ----
  $cBg      = [System.Drawing.Color]::FromArgb(255, 0x0a,0x09,0x08)
  $cAmber   = [System.Drawing.Color]::FromArgb(255, 0xe0,0x94,0x22)
  $cAmberBr = [System.Drawing.Color]::FromArgb(255, 0xF7,0x93,0x1A)
  $cInkBr   = [System.Drawing.Color]::FromArgb(255, 0xec,0xe4,0xd6)
  $cInk     = [System.Drawing.Color]::FromArgb(255, 0xcc,0xc6,0xb8)
  $cInkDim  = [System.Drawing.Color]::FromArgb(255, 0x96,0x8b,0x7a)
  $cInkFaint= [System.Drawing.Color]::FromArgb(255, 0x5a,0x52,0x47)
  $cGrid    = [System.Drawing.Color]::FromArgb([int](0.15*255), 0xe0,0x94,0x22)
  $cGridStr = [System.Drawing.Color]::FromArgb([int](0.30*255), 0xe0,0x94,0x22)
  $cMillion = [System.Drawing.Color]::FromArgb([int](0.55*255), 0xec,0xe4,0xd6)

  $bBg     = New-Object System.Drawing.SolidBrush($cBg)
  $g.FillRectangle($bBg, 0, 0, $W, $H)

  # ---- fonts (Segoe UI ~ Inter; Georgia ~ Cormorant) ----
  $fTitle   = New-Object System.Drawing.Font('Georgia',      30, [System.Drawing.FontStyle]::Bold)
  $fSub     = New-Object System.Drawing.Font('Segoe UI',     13.5, [System.Drawing.FontStyle]::Regular)
  $fAnnBig  = New-Object System.Drawing.Font('Segoe UI Semibold', 17, [System.Drawing.FontStyle]::Bold)
  $fAnn     = New-Object System.Drawing.Font('Segoe UI',     12.5, [System.Drawing.FontStyle]::Regular)
  $fAxis    = New-Object System.Drawing.Font('Segoe UI',     11.5, [System.Drawing.FontStyle]::Regular)
  $fLegend  = New-Object System.Drawing.Font('Segoe UI Semibold', 13, [System.Drawing.FontStyle]::Bold)
  $fEnd     = New-Object System.Drawing.Font('Segoe UI Semibold', 13, [System.Drawing.FontStyle]::Bold)
  $fWmk     = New-Object System.Drawing.Font('Segoe UI',     11, [System.Drawing.FontStyle]::Regular)

  $bInkBr  = New-Object System.Drawing.SolidBrush($cInkBr)
  $bInk    = New-Object System.Drawing.SolidBrush($cInk)
  $bInkDim = New-Object System.Drawing.SolidBrush($cInkDim)
  $bInkFaint=New-Object System.Drawing.SolidBrush($cInkFaint)
  $bAmber  = New-Object System.Drawing.SolidBrush($cAmber)
  $bMillion= New-Object System.Drawing.SolidBrush($cMillion)

  $sfNear   = New-Object System.Drawing.StringFormat
  $sfCenter = New-Object System.Drawing.StringFormat; $sfCenter.Alignment = 'Center'
  $sfFar    = New-Object System.Drawing.StringFormat; $sfFar.Alignment    = 'Far'

  # ---- plot geometry (1600x900 authoring space) ----
  $plotL = 118.0; $plotR = 1476.0; $plotT = 196.0; $plotB = 812.0
  $plotW = $plotR - $plotL; $plotH = $plotB - $plotT

  # ---- y scale: nice ceiling above peak stack value ----
  $peakStack = ($series | Measure-Object -Property Value -Maximum).Maximum
  function NiceCeil([double]$x) {
    if ($x -le 0) { return 1.0 }
    $exp = [math]::Floor([math]::Log10($x))
    $base = [math]::Pow(10, $exp)
    $f = $x / $base
    $nf = if ($f -le 1) {1} elseif ($f -le 2){2} elseif ($f -le 2.5){2.5} elseif ($f -le 5){5} else {10}
    return $nf * $base
  }
  $yMax = NiceCeil ($peakStack * 1.08)
  # pick a tick step giving ~6-8 lines
  $rawStep = $yMax / 7.0
  $stepExp = [math]::Floor([math]::Log10($rawStep))
  $stepBase= [math]::Pow(10, $stepExp)
  $sf2 = $rawStep / $stepBase
  $niceStep = $(if ($sf2 -le 1){1} elseif ($sf2 -le 2){2} elseif ($sf2 -le 2.5){2.5} elseif ($sf2 -le 5){5} else {10}) * $stepBase

  $xForDay = { param($d) [single]($plotL + (($d - $startDay) / [double]($endDay - $startDay)) * $plotW) }
  $yForVal = { param($v) [single]($plotB - ($v / $yMax) * $plotH) }

  function FmtMoney([double]$v) {
    if ($v -ge 1000000) { return ('${0:0.##}M' -f ($v/1000000.0)) }
    if ($v -ge 1000)    { return ('${0:0}k'   -f ($v/1000.0)) }
    return ('${0:0}' -f $v)
  }

  # ---- horizontal gridlines + y labels ----
  $penGrid = New-Object System.Drawing.Pen($cGrid, (& $S 1))
  $penMill = New-Object System.Drawing.Pen($cMillion, (& $S 1.4)); $penMill.DashStyle = 'Dash'
  for ($v = 0.0; $v -le $yMax + 1; $v += $niceStep) {
    $y = & $yForVal $v
    $g.DrawLine($penGrid, (& $S $plotL), $y, (& $S $plotR), $y)
    $lbl = FmtMoney $v
    $g.DrawString($lbl, $fAxis, $bInkDim, (& $S ($plotL - 12)), ($y - (& $S 9)), $sfFar)
  }

  # ---- $1M reference line (the target the essay narrates) ----
  if ($yMax -ge 1000000) {
    $y1m = & $yForVal 1000000.0
    $g.DrawLine($penMill, (& $S $plotL), $y1m, (& $S $plotR), $y1m)
  }

  # ---- vertical year gridlines + x labels ----
  $penYear = New-Object System.Drawing.Pen($cGrid, (& $S 1))
  $yr0 = (DayToDate $startDay).Year
  $yrN = (DayToDate $endDay).Year
  for ($yr = $yr0; $yr -le $yrN; $yr++) {
    $jan1 = [datetime]::new($yr,1,1,0,0,0,[DateTimeKind]::Utc)
    $dyr = [int](DateToDay $jan1)
    if ($dyr -lt $startDay -or $dyr -gt $endDay) { continue }
    $x = & $xForDay $dyr
    $g.DrawLine($penYear, $x, (& $S $plotT), $x, (& $S $plotB))
    $g.DrawString([string]$yr, $fAxis, $bInkDim, $x, (& $S ($plotB + 8)), $sfCenter)
  }

  # ---- build point arrays ----
  $ptsVal = New-Object System.Collections.Generic.List[System.Drawing.PointF]
  $ptsCon = New-Object System.Collections.Generic.List[System.Drawing.PointF]
  foreach ($r in $series) {
    $x = & $xForDay $r.Day
    $ptsVal.Add((New-Object System.Drawing.PointF($x, (& $yForVal $r.Value))))
    $ptsCon.Add((New-Object System.Drawing.PointF($x, (& $yForVal $r.Contrib))))
  }

  # ---- contributions (muted, flat-climbing) ----
  $penCon = New-Object System.Drawing.Pen($cInkDim, (& $S 2.4))
  $penCon.LineJoin = 'Round'
  $g.DrawLines($penCon, $ptsCon.ToArray())

  # ---- stack value (amber, the divergence) ----
  $penVal = New-Object System.Drawing.Pen($cAmber, (& $S 3.2))
  $penVal.LineJoin = 'Round'; $penVal.StartCap='Round'; $penVal.EndCap='Round'
  $g.DrawLines($penVal, $ptsVal.ToArray())

  # ---- axis frame (left + bottom) ----
  $penAxis = New-Object System.Drawing.Pen($cGridStr, (& $S 1.4))
  $g.DrawLine($penAxis, (& $S $plotL), (& $S $plotT), (& $S $plotL), (& $S $plotB))
  $g.DrawLine($penAxis, (& $S $plotL), (& $S $plotB), (& $S $plotR), (& $S $plotB))

  # ============ TITLE + SUBTITLE ============
  $g.DrawString('The inputs are linear. The outcome is not.', $fTitle, $bInkBr, (& $S $plotL), (& $S 44), $sfNear)
  $sub1 = '$30 of bitcoin every day since January 2017 - contributions vs. stack value,'
  $sub2 = "computed from bitcoin's actual price history."
  $g.DrawString($sub1, $fSub, $bInkDim, (& $S $plotL), (& $S 104), $sfNear)
  $g.DrawString($sub2, $fSub, $bInkDim, (& $S $plotL), (& $S 128), $sfNear)

  # ============ LEGEND (top-left of plot) ============
  $lx = & $S ($plotL + 22); $ly = & $S ($plotT + 22)
  $g.FillRectangle($bAmber, $lx, ($ly + (& $S 7)), (& $S 34), (& $S 4))
  $g.DrawString('Stack value', $fLegend, $bInkBr, ($lx + (& $S 46)), $ly, $sfNear)
  $ly2 = $ly + (& $S 30)
  $penLg = New-Object System.Drawing.Pen($cInkDim, (& $S 3))
  $g.DrawLine($penLg, $lx, ($ly2 + (& $S 9)), ($lx + (& $S 34)), ($ly2 + (& $S 9)))
  $g.DrawString('Contributions ($30/day)', $fLegend, $bInkDim, ($lx + (& $S 46)), $ly2, $sfNear)

  # ============ ANNOTATION: $1M crossing ============
  if ($null -ne $crossDay -and $yMax -ge 1000000) {
    $cx = & $xForDay $crossDay
    $cy = & $yForVal 1000000.0
    # marker
    $penMk = New-Object System.Drawing.Pen($cInkBr, (& $S 2.5))
    $g.FillEllipse($bAmber, ($cx-(& $S 7)), ($cy-(& $S 7)), (& $S 14), (& $S 14))
    $g.DrawEllipse($penMk, ($cx-(& $S 7)), ($cy-(& $S 7)), (& $S 14), (& $S 14))
    # leader + label: placed up-and-LEFT of the marker, in the dark band
    # above the $1M line (years 2022-2024), where nothing overlaps the amber.
    $anchorX = $cx - (& $S 24)
    $lby = $cy - (& $S 138)
    $penLd = New-Object System.Drawing.Pen($cInkFaint, (& $S 1.2))
    $g.DrawLine($penLd, ($cx-(& $S 8)), $cy, $anchorX, ($lby + (& $S 60)))
    $crossDt = DayToDate $crossDay
    $g.DrawString('$1,000,000 stack', $fAnnBig, $bInkBr, $anchorX, $lby, $sfFar)
    $g.DrawString($crossDt.ToString('MMM d, yyyy'), $fAnn, $bAmber, $anchorX, ($lby + (& $S 26)), $sfFar)
    $inLbl = '{0:C0} of $30/day in' -f $crossContrib
    $g.DrawString($inLbl, $fAnn, $bInkDim, $anchorX, ($lby + (& $S 46)), $sfFar)
  }

  # ============ ANNOTATION: deepest drawdown ============
  if ($maxDD -lt -0.001) {
    $dx = & $xForDay $ddDay
    $dy = & $yForVal $ddVal
    $penMk2 = New-Object System.Drawing.Pen($cAmber, (& $S 2.5))
    $g.FillEllipse($bInkBr, ($dx-(& $S 6)), ($dy-(& $S 6)), (& $S 12), (& $S 12))
    $g.DrawEllipse($penMk2, ($dx-(& $S 6)), ($dy-(& $S 6)), (& $S 12), (& $S 12))
    $ddLbl = '{0:0}%' -f ($maxDD*100)
    $tw = $g.MeasureString($ddLbl, $fAnnBig)
    $lbx2 = $dx - ($tw.Width/2.0)
    $lby2 = $dy + (& $S 16)
    $g.DrawString($ddLbl, $fAnnBig, $bAmber, $lbx2, $lby2, $sfNear)
    $g.DrawString('deepest drawdown', $fAnn, $bInkDim, ($dx), ($lby2 + (& $S 24)), $sfCenter)
  }

  # ============ END-OF-LINE final value labels ============
  $lastPt = $ptsVal[$ptsVal.Count-1]
  $g.DrawString((FmtMoney $finalVal), $fEnd, $bAmber, ($lastPt.X + (& $S 8)), ($lastPt.Y - (& $S 9)), $sfNear)
  $lastCon = $ptsCon[$ptsCon.Count-1]
  $g.DrawString((FmtMoney $finalContrib), $fEnd, $bInkDim, ($lastCon.X + (& $S 8)), ($lastCon.Y - (& $S 9)), $sfNear)

  # ============ WATERMARK ============
  $g.DrawString('lastcoinstanding.com', $fWmk, $bInkFaint, (& $S $plotR), (& $S ($plotB + 30)), $sfFar)

  # ---- save ----
  $g.Dispose()
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  "Wrote $Path ($W x $H)"
}

$out1 = Join-Path $OutDir 'thirty-a-day.png'
$out2 = Join-Path $OutDir 'thirty-a-day@2x.png'
New-Chart -Scale 1.0 -Path $out1
New-Chart -Scale 2.0 -Path $out2
""
