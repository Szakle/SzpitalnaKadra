namespace SzpitalnaKadra.Helpers
{
    public static class PwzValidator
    {
        /// <summary>
        /// Sprawdza poprawność numeru PWZ dla lekarzy.
        /// Numer PWZ to 7-cyfrowy numer, gdzie pierwsza cyfra jest cyfrą kontrolną.
        /// </summary>
        /// <param name="pwz">Numer PWZ do sprawdzenia</param>
        /// <returns>True jeśli numer jest poprawny, false w przeciwnym przypadku</returns>
        public static bool SprawdzPwz(string pwz)
        {
            if (string.IsNullOrEmpty(pwz))
                return true; // Puste pole jest dozwolone

            // Usuń ewentualne spacje
            pwz = pwz.Trim();

            // Numer nie może zaczynać się od 0
            if (pwz.StartsWith("0"))
                return false;

            // Numer musi składać się z dokładnie 7 cyfr
            if (pwz.Length != 7 || !System.Text.RegularExpressions.Regex.IsMatch(pwz, @"^\d{7}$"))
                return false;

            // Obliczenie cyfry kontrolnej
            int cyfraKontrolna = (
                int.Parse(pwz[1].ToString()) * 1 +
                int.Parse(pwz[2].ToString()) * 2 +
                int.Parse(pwz[3].ToString()) * 3 +
                int.Parse(pwz[4].ToString()) * 4 +
                int.Parse(pwz[5].ToString()) * 5 +
                int.Parse(pwz[6].ToString()) * 6
            ) % 11;

            if (cyfraKontrolna == 10)
                cyfraKontrolna = 0;

            return cyfraKontrolna.ToString() == pwz[0].ToString();
        }

        /// <summary>
        /// Sprawdza czy typ personelu to lekarz (id=2) lub lekarz dentysta (id=17)
        /// </summary>
        public static bool JestLekarzem(int? typPersoneluId)
        {
            return typPersoneluId == 2 || typPersoneluId == 17;
        }

        /// <summary>
        /// Waliduje numer PWZ dla lekarzy. Zwraca komunikat błędu lub null jeśli OK.
        /// </summary>
        public static string? WalidujPwzDlaLekarza(string? pwz, int? typPersoneluId)
        {
            // Jeśli nie jest lekarzem, nie sprawdzaj PWZ
            if (!JestLekarzem(typPersoneluId))
                return null;

            // Jeśli jest lekarzem ale nie ma PWZ, to OK (może mieć Id RIZM)
            if (string.IsNullOrWhiteSpace(pwz))
                return null;

            // Sprawdź czy to format 7-cyfrowy (PWZ lekarza)
            var pwzTrimmed = pwz.Trim();
            if (!System.Text.RegularExpressions.Regex.IsMatch(pwzTrimmed, @"^\d{7}$"))
            {
                // Może to być inny format (np. Id RIZM), więc nie waliduj
                return null;
            }

            // Waliduj numer PWZ
            if (!SprawdzPwz(pwzTrimmed))
            {
                return $"Niepoprawny numer PWZ: {pwzTrimmed}. Cyfra kontrolna nie zgadza się.";
            }

            return null;
        }
    }
}
