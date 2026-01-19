# Szpitalna Kadra - Deployment

## Wymagania
- Docker i Docker Compose

## Szybki start

```bash
docker-compose up -d --build
```

Aplikacja bedzie dostepna pod:
- Frontend: http://localhost:7700
- Backend API: http://localhost:7701
- Baza danych: localhost:7702

## Konfiguracja

Edytuj plik `.env` aby zmienic:
- Porty (FRONTEND_PORT, BACKEND_PORT, DB_PORT)
- Dane bazy (POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD)

## Komendy

### Uruchomienie
```bash
docker-compose up -d --build
```

### Zatrzymanie
```bash
docker-compose down
```

### Reset bazy (usuwa wszystkie dane!)
```bash
docker-compose down -v
docker-compose up -d --build
```

### Logi
```bash
docker-compose logs -f
```

## Uzytkownicy domyslni
- admin
- test
- czytelnik
- dodawacz