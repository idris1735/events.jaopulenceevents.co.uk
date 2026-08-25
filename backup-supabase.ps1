# ============================================================
# Supabase backup for free-tier projects (no built-in backups)
# ------------------------------------------------------------
# Backs up:
#   1. Full database dump (schema + data)  -> backups\supabase-<timestamp>\database.sql
#   2. All Storage buckets + files         -> backups\supabase-<timestamp>\storage\...
#      (ticket PDFs live here and are NOT included in the DB dump)
#   3. Summary                              -> backups\supabase-<timestamp>\backup-info.txt
#
# Usage:  powershell -ExecutionPolicy Bypass -File .\backup-supabase.ps1
# You will be asked for your database password (Settings -> Database).
# Secrets are read from .env.local on this machine and never leave it.
# ============================================================

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$EnvFile = Join-Path $Root ".env.local"

function Read-EnvValue([string]$name) {
  $line = Select-String -Path $EnvFile -Pattern "^$name=" | Select-Object -First 1
  if (-not $line) { return $null }
  return ($line.Line -replace "^$name=", "").Trim()
}

function Escape-PathSegments([string]$p) {
  ($p -split "/" | ForEach-Object { [uri]::EscapeDataString($_) }) -join "/"
}

$SupabaseUrl = Read-EnvValue "NEXT_PUBLIC_SUPABASE_URL"
$ServiceKey  = Read-EnvValue "SUPABASE_SERVICE_ROLE_KEY"

if (-not $SupabaseUrl -or -not $ServiceKey) {
  Write-Error "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  exit 1
}

$ProjectRef = ([uri]$SupabaseUrl).Host -split "\." | Select-Object -First 1
$Stamp      = Get-Date -Format "yyyyMMdd-HHmmss"
$OutDir     = Join-Path $Root "backups\supabase-$Stamp"
$StorageDir = Join-Path $OutDir "storage"

New-Item -ItemType Directory -Force -Path $StorageDir | Out-Null
Write-Host "Backing up Supabase project [$ProjectRef] to:"
Write-Host "  $OutDir"

# ── 1. Database dump ────────────────────────────────────────
$dbPassword = Read-Host "Enter the Supabase DATABASE password (Settings -> Database -> Connection string)"
$dbUrl = "postgresql://postgres.$ProjectRef`:$([uri]::EscapeDataString($dbPassword))@db.$ProjectRef.supabase.co:5432/postgres"
$dbFile = Join-Path $OutDir "database.sql"

Write-Host "Dumping database (this can take a minute)..."
supabase db dump --db-url $dbUrl -f $dbFile
if ($LASTEXITCODE -ne 0) {
  Write-Error "Database dump failed. Check the password and that the project is not paused."
  exit 1
}
Write-Host "  -> database.sql saved"

# ── 2. Storage buckets ──────────────────────────────────────
$headers = @{ Authorization = "Bearer $ServiceKey" }

function Get-BucketObjects([string]$bucket, [string]$prefix) {
  $body = @{ prefix = $prefix; limit = 1000; offset = 0 } | ConvertTo-Json
  $res = Invoke-RestMethod -Uri "$SupabaseUrl/storage/v1/object/list/$bucket" `
                           -Method Post -Headers $headers `
                           -Body $body -ContentType "application/json"
  $objects = @()
  foreach ($item in $res) {
    $full = if ($prefix) { "$prefix/$($item.name)" } else { $item.name }
    if ($item.id) {
      $objects += $full
    } else {
      $objects += Get-BucketObjects $bucket $full
    }
  }
  return ,$objects
}

try {
  $buckets = Invoke-RestMethod -Uri "$SupabaseUrl/storage/v1/bucket" -Headers $headers -Method Get
} catch {
  $buckets = @()
  Write-Warning "Could not list buckets: $($_.Exception.Message)"
}

$fileCount = 0
foreach ($bucket in $buckets) {
  $bucketName = $bucket.name
  Write-Host "Bucket: $bucketName"
  $objects = @(Get-BucketObjects $bucketName "")
  foreach ($object in $objects) {
    $localPath = Join-Path $StorageDir "$bucketName\$object"
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $localPath) | Out-Null
    try {
      Invoke-WebRequest -Uri "$SupabaseUrl/storage/v1/object/$bucketName/$(Escape-PathSegments $object)" `
                        -Headers $headers -OutFile $localPath -UseBasicParsing
      $fileCount += 1
    } catch {
      Write-Warning "  Failed to download $bucketName/$object : $($_.Exception.Message)"
    }
  }
  Write-Host "  -> $($objects.Count) files"
}

# ── 3. Summary ──────────────────────────────────────────────
$summary = @"
Supabase backup
Project ref : $ProjectRef
Created     : $(Get-Date)
Database    : database.sql ($('{0:N0}' -f ((Get-Item $dbFile).Length / 1KB)) KB)
Storage     : $fileCount file(s) in storage\
"@
$summary | Out-File -FilePath (Join-Path $OutDir "backup-info.txt") -Encoding utf8

Write-Host ""
Write-Host "Backup complete: $OutDir"
Write-Host "Keep this folder somewhere safe (e.g. copy to an external drive or cloud storage)."
