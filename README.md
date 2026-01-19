# Szpitalna Kadra - Deploy

## Wymagania
- Docker i Docker Compose

## Konfiguracja
Edytuj plik `.env` przed uruchomieniem:

```env
FRONTEND_PORT=7700
BACKEND_PORT=7701
DB_PORT=7702
POSTGRES_USER=szpitalna_kadra_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=szpitalna_kadra_db
```

## Uruchomienie

```bash
docker-compose up -d --build
```

## Dostęp
- Frontend: http://localhost:7700
- Backend API: http://localhost:7701/api

## Przywracanie bazy danych
Backup znajduje się w `backup/backup.backup`. Aby przywrócić:

```bash
docker exec -i szpitalna-kadra-db pg_restore -U szpitalna_kadra_user -d szpitalna_kadra_db < backup/backup.backup
```

## Zatrzymanie

```bash
docker-compose down
```

## Funkcje
- Zarządzanie personelem medycznym
- Import danych z SZOI (scraper)
- Dwuskładnikowe uwierzytelnianie (2FA)
- Zarządzanie użytkownikami

## Porty
| Usługa   | Port |
|----------|------|
| Frontend | 7700 |
| Backend  | 7701 |
| Database | 7702 |