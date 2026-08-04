<#
  og-daily-conviction.ps1 — product-forward OG card for /what-daily-conviction-bought.
  Renders the legend config ($30/day since 2017) contributions-vs-value chart at
  1280x720 and saves og-what-daily-conviction-bought.jpg at the repo root.

  GDI+ render (Segoe UI ~ Inter, Georgia ~ Cormorant), not the Playwright house
  pipeline — regenerate via scripts/build-og-images.py once the page is live if
  pixel-true house type is wanted. Computes from PL_DATA (same sim as the page).
#>
param(
  [string]$DataFile = "$PSScriptRoot/../src/_includes/_pageassets/shared/power-law-data.js",
  [string]$OutFile  = "$PSScriptRoot/../og-what-daily-conviction-bought.jpg"
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$GEN = 1230940800
$genesis = [datetimeoffset]::FromUnixTimeSeconds($GEN).UtcDateTime
$raw = Get-Content -LiteralPath $DataFile -Raw
$mm = [regex]::Match($raw, 'var\s+PL_DATA\s*=\s*(\[.*?\]);', 'Singleline')
$pairs = [regex]::Matches($mm.Groups[1].Value, '\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]')
$SD=@(); $SP=@(); foreach($p in $pairs){ $SD+=[double]$p.Groups[1].Value; $SP+=[double]$p.Groups[2].Value }
$FIRST=$SD[0]; $LAST=$SD[$SD.Count-1]
function Interp([int]$d){
  if($d -le $FIRST){return $SP[0]}; if($d -ge $LAST){return $SP[$SP.Count-1]}
  $lo=0;$hi=$SD.Count-1; while($hi-$lo -gt 1){ $mid=[int](($lo+$hi)/2); if($SD[$mid] -le $d){$lo=$mid}else{$hi=$mid} }
  $t=($d-$SD[$lo])/($SD[$hi]-$SD[$lo]); [math]::Exp([math]::Log($SP[$lo])+$t*([math]::Log($SP[$hi])-[math]::Log($SP[$lo])))
}
$startDay=[int][math]::Floor(([datetimeoffset]::new([datetime]::new(2017,1,1,0,0,0,[DateTimeKind]::Utc)).ToUnixTimeSeconds()-$GEN)/86400)
$amt=30.0; $btc=0.0; $contrib=0.0; $crossDay=$null
$cx=New-Object 'System.Collections.Generic.List[double]'; $vy=New-Object 'System.Collections.Generic.List[double]'; $cy=New-Object 'System.Collections.Generic.List[double]'; $dxs=New-Object 'System.Collections.Generic.List[int]'
for($d=$startDay;$d -le $LAST;$d++){
  $px=Interp $d; $btc+=$amt/$px; $contrib+=$amt; $val=$btc*$px
  if($null -eq $crossDay -and $val -ge 1000000){$crossDay=$d}
  $dxs.Add($d); $vy.Add($val); $cy.Add($contrib)
}
$peakVal=($vy | Measure-Object -Maximum).Maximum
$yMax = [math]::Ceiling($peakVal/250000)*250000

$W=1280;$H=720
$bmp=New-Object System.Drawing.Bitmap($W,$H)
$g=[System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint=[System.Drawing.Text.TextRenderingHint]::AntiAlias
$g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,10,9,8))),0,0,$W,$H)
$cAmber=[System.Drawing.Color]::FromArgb(255,224,148,34)
$cInk=[System.Drawing.Color]::FromArgb(255,242,238,232)
$cDim=[System.Drawing.Color]::FromArgb(255,154,144,128)
$cMuted=[System.Drawing.Color]::FromArgb(255,139,131,117)
$fTitle=New-Object System.Drawing.Font('Georgia',34,[System.Drawing.FontStyle]::Bold)
$fSub=New-Object System.Drawing.Font('Segoe UI',14)
$fWmk=New-Object System.Drawing.Font('Segoe UI',12)
$g.DrawString('What Daily Conviction Bought',$fTitle,(New-Object System.Drawing.SolidBrush $cInk),56,44)
$g.DrawString('$30 of bitcoin every day since January 2017 - contributions vs. stack value, computed live from price history.',$fSub,(New-Object System.Drawing.SolidBrush $cDim),58,104)

# plot area
$pL=90.0;$pR=1210.0;$pT=170.0;$pB=650.0
function X([int]$d){ [single]($pL + ($d-$startDay)/[double]($LAST-$startDay)*($pR-$pL)) }
function Y([double]$v){ [single]($pB - ($v/$yMax)*($pB-$pT)) }
$penGrid=New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(38,224,148,34)),1
for($v=0.0;$v -le $yMax+1;$v+=250000){ $yy=Y $v; $g.DrawLine($penGrid,[single]$pL,$yy,[single]$pR,$yy)
  $lbl= if($v -ge 1000000){'${0:0.##}M' -f ($v/1000000)}else{'${0:0}K' -f ($v/1000)}
  $g.DrawString($lbl,$fWmk,(New-Object System.Drawing.SolidBrush $cMuted),[single]($pL-64),[single]($yy-8)) }
# $1M dashed line
$pen1m=New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(120,236,228,214)),1.4; $pen1m.DashStyle='Dash'
$g.DrawLine($pen1m,[single]$pL,(Y 1000000),[single]$pR,(Y 1000000))
# contributions (muted) + value (amber)
$penC=New-Object System.Drawing.Pen $cMuted,2.4
$penV=New-Object System.Drawing.Pen $cAmber,3.0; $penV.LineJoin='Round'
$ptsC=New-Object 'System.Collections.Generic.List[System.Drawing.PointF]'; $ptsV=New-Object 'System.Collections.Generic.List[System.Drawing.PointF]'
for($i=0;$i -lt $dxs.Count;$i+=4){ $ptsC.Add((New-Object System.Drawing.PointF((X $dxs[$i]),(Y $cy[$i])))); $ptsV.Add((New-Object System.Drawing.PointF((X $dxs[$i]),(Y $vy[$i])))) }
$g.DrawLines($penC,$ptsC.ToArray()); $g.DrawLines($penV,$ptsV.ToArray())
if($null -ne $crossDay){ $mx=X $crossDay; $my=Y 1000000; $g.FillEllipse((New-Object System.Drawing.SolidBrush $cAmber),($mx-6),($my-6),12,12); $g.DrawEllipse((New-Object System.Drawing.Pen $cInk,2),($mx-6),($my-6),12,12) }
# labels at line ends
$g.DrawString(('${0:0}K' -f (($vy[$vy.Count-1])/1000)),(New-Object System.Drawing.Font('Segoe UI Semibold',13,[System.Drawing.FontStyle]::Bold)),(New-Object System.Drawing.SolidBrush $cAmber),[single]($pR+8),[single]((Y $vy[$vy.Count-1])-9))
$g.DrawString('$105K',(New-Object System.Drawing.Font('Segoe UI Semibold',13,[System.Drawing.FontStyle]::Bold)),(New-Object System.Drawing.SolidBrush $cMuted),[single]($pR+8),[single]((Y $cy[$cy.Count-1])-9))
$g.DrawString('lastcoinstanding.com',$fWmk,(New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(150,139,131,117))),[single]($pR-160),[single]($pB+34))

# save JPEG q90
$codec=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$eps=New-Object System.Drawing.Imaging.EncoderParameters(1)
$eps.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality,[long]90)
$g.Dispose(); $bmp.Save($OutFile,$codec,$eps); $bmp.Dispose()
"Wrote $OutFile ($W x $H)"
