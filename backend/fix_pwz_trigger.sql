-- Modyfikacja triggera walidacji PWZ
-- Pomija walidację dla numerów pielęgniarek/położnych (kończących się na literę)

CREATE OR REPLACE FUNCTION public.waliduj_pwz_trigger() 
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Pomijamy walidację jeśli numer kończy się na literę (pielęgniarki, położne)
    -- lub jeśli numer jest pusty/null
    IF NEW.npwz_id_rizh IS NULL OR NEW.npwz_id_rizh = '' THEN
        RETURN NEW;
    END IF;
    
    -- Sprawdź czy ostatni znak to litera (np. P dla pielęgniarek, A dla położnych)
    IF NEW.npwz_id_rizh ~ '[A-Za-z]$' THEN
        -- Dla pielęgniarek/położnych nie sprawdzamy cyfry kontrolnej
        RETURN NEW;
    END IF;
    
    -- Dla lekarzy sprawdzamy standardową walidację
    IF NOT sprawdz_pwz_pojedynczy(NEW.npwz_id_rizh) THEN
        RAISE EXCEPTION 'P0001: Nieprawidłowy numer PWZ: %. Cyfra kontrolna nie zgadza się.', NEW.npwz_id_rizh;
    END IF;
    
    RETURN NEW;
END;
$$;
