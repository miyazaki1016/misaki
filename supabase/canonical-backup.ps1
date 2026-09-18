param([Parameter(Mandatory=$true)][string]$CheckpointDirectory)
$ErrorActionPreference = 'Stop'
# Set PGHOST/PGPORT/PGDATABASE/PGUSER and a protected PGPASSFILE externally.
# Never pass a password/connection URL in arguments or save it in this repo.
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$checkpointPath = [IO.Path]::GetFullPath($CheckpointDirectory)
if ($checkpointPath.StartsWith($repoRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or $checkpointPath -eq $repoRoot) {
  throw 'Checkpoint must be outside the repository on encrypted, access-restricted storage.'
}
if (Test-Path -LiteralPath $checkpointPath) { throw 'Use a new checkpoint directory; do not overwrite recovery evidence.' }
Get-Command pg_dump,pg_restore,psql | Out-Null
New-Item -ItemType Directory -Path $checkpointPath | Out-Null
Push-Location -LiteralPath $checkpointPath
try {
  & psql -X --set ON_ERROR_STOP=1 --file (Join-Path $PSScriptRoot 'canonical-checkpoint.sql')
  if ($LASTEXITCODE -ne 0) { throw 'Checkpoint preflight failed.' }
  & pg_dump --format=custom --schema-only --schema=public --schema=misaki_operations --schema=supabase_migrations --file=schema.dump
  if ($LASTEXITCODE -ne 0) { throw 'Schema backup failed.' }
  & pg_dump --format=custom --data-only --table=public.misaki_relationship_state --table=public.misaki_relationship_events --table=public.misaki_user_conversation_state --table=public.background_push_state --table=public.daily_message_usage --table=public.daily_message_requests --table=public.misaki_proactive_deliveries --file=data.dump
  if ($LASTEXITCODE -ne 0) { throw 'Data backup failed.' }
  & pg_restore --list schema.dump | Out-File -Encoding utf8 schema-toc.txt
  if ($LASTEXITCODE -ne 0) { throw 'Schema archive invalid.' }
  & pg_restore --list data.dump | Out-File -Encoding utf8 data-toc.txt
  if ($LASTEXITCODE -ne 0) { throw 'Data archive invalid.' }
  & pg_restore --data-only --file=restore-data.sql data.dump
  if ($LASTEXITCODE -ne 0) { throw 'Data extraction failed.' }
  Get-ChildItem -File | Get-FileHash -Algorithm SHA256 | Select-Object @{Name='File';Expression={Split-Path $_.Path -Leaf}},Hash | Export-Csv -NoTypeInformation -Path checksums.csv
  Write-Output 'Archives created. Restore rehearsal and final frozen-state comparison are still required before migration.'
} finally { Pop-Location }
