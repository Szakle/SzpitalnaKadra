#!/bin/bash
set -e

echo "Sprawdzam czy baza wymaga inicjalizacji..."

# Sprawdz czy tabela dbuser istnieje (oznacza ze baza jest juz zainicjalizowana)
TABLE_EXISTS=$(psql -U $POSTGRES_USER -d $POSTGRES_DB -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dbuser');")

if [ "$TABLE_EXISTS" = "f" ]; then
    echo "Baza pusta - przywracam backup..."
    pg_restore -U $POSTGRES_USER -d $POSTGRES_DB --no-owner --no-privileges /backup/backup.backup || true
    echo "Backup przywrocony!"
else
    echo "Baza juz zainicjalizowana - pomijam restore."
fi