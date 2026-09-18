#!/bin/bash
# backup-db.sh — Backup diario de Supabase/PostgreSQL
# Ejecutar: crontab -e → 0 2 * * * /path/to/backup-db.sh

set -e

BACKUP_DIR="${BACKUP_DIR:-$HOME/egchat-backups}"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
DB_URL="${SUPABASE_DB_URL:-$DATABASE_URL}"

mkdir -p "$BACKUP_DIR"

if [ -z "$DB_URL" ]; then
  echo "❌ SUPABASE_DB_URL o DATABASE_URL no configurado"
  exit 1
fi

echo "🔄 Iniciando backup — $DATE"

# Backup completo
BACKUP_FILE="$BACKUP_DIR/egchat_backup_$DATE.sql.gz"
pg_dump "$DB_URL" | gzip > "$BACKUP_FILE"
echo "  ✅ Backup creado: $(du -sh "$BACKUP_FILE" | cut -f1)"

# Solo tablas KYC (más pequeño, más frecuente)
KYC_FILE="$BACKUP_DIR/egchat_kyc_$DATE.sql.gz"
pg_dump "$DB_URL" -t kyc_verifications -t kyc_personal_data -t kyc_documents -t kyc_audit_log | gzip > "$KYC_FILE"
echo "  ✅ Backup KYC creado: $(du -sh "$KYC_FILE" | cut -f1)"

# Limpiar backups antiguos
find "$BACKUP_DIR" -name "*.sql.gz" -mtime "+$RETENTION_DAYS" -delete
echo "  🧹 Backups de más de $RETENTION_DAYS días eliminados"

echo "✅ Backup completado — $DATE"
