-- Dodanie kolumny data_zgonu do tabeli osoba
ALTER TABLE osoba ADD COLUMN IF NOT EXISTS data_zgonu DATE;
