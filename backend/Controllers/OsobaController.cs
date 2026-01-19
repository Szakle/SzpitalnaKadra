using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SzpitalnaKadra.Data;
using SzpitalnaKadra.Models;
using SzpitalnaKadra.Helpers;
using Npgsql;

namespace SzpitalnaKadra.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OsobaController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OsobaController(AppDbContext context)
        {
            _context = context;
        }

        private List<Osoba> GetOsobyWithFallback()
        {
            try
            {
                return _context.Osoby.ToList();
            }
            catch (Exception ex) when (ex.ToString().Contains("42703") || ex.ToString().Contains("data_zgonu"))
            {
                return _context.Osoby.FromSqlRaw(@"
                    SELECT id, pesel, plec_id, data_urodzenia, nazwisko, imie, imie2, 
                           typ_personelu_id, nr_pwz, numer_telefonu, NULL::date as data_zgonu
                    FROM osoba
                ").ToList();
            }
        }

        [HttpGet("filters")]
        public IActionResult GetFilters()
        {
            try
            {
                var plecIds = _context.Osoby.Select(o => o.PlecId).Distinct().OrderBy(p => p).ToList();
                var typPersoneluIds = _context.Osoby.Select(o => o.TypPersoneluId).Distinct().OrderBy(t => t).ToList();

                return Ok(new { plecIds, typPersoneluIds });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetAll(
            [FromQuery] string? pesel, 
            [FromQuery] string? imie, 
            [FromQuery] string? nazwisko,
            [FromQuery] string? nrPwz,
            [FromQuery] int? plecId,
            [FromQuery] int? typPersoneluId,
            [FromQuery] bool? aktywnieZatrudnieni,
            [FromQuery] bool? majaOgraniczenia,
            [FromQuery] string? rodzajWyksztalcenia)
        {
            var osoby = GetOsobyWithFallback();

            // Filtrowanie wyszukiwania
            if (!string.IsNullOrWhiteSpace(pesel))
                osoby = osoby.Where(o => o.Pesel != null && o.Pesel.ToLower().Contains(pesel.ToLower())).ToList();

            if (!string.IsNullOrWhiteSpace(imie))
                osoby = osoby.Where(o => o.Imie.ToLower().Contains(imie.ToLower())).ToList();

            if (!string.IsNullOrWhiteSpace(nazwisko))
                osoby = osoby.Where(o => o.Nazwisko.ToLower().Contains(nazwisko.ToLower())).ToList();

            if (!string.IsNullOrWhiteSpace(nrPwz))
                osoby = osoby.Where(o => o.NrPwz != null && o.NrPwz.ToLower().Contains(nrPwz.ToLower())).ToList();

            // Filtrowanie dropdown
            if (plecId.HasValue)
                osoby = osoby.Where(o => o.PlecId == plecId.Value).ToList();

            if (typPersoneluId.HasValue)
                osoby = osoby.Where(o => o.TypPersoneluId == typPersoneluId.Value).ToList();

            // Filtrowanie na podstawie zatrudnienia
            if (aktywnieZatrudnieni.HasValue && aktywnieZatrudnieni.Value)
            {
                var dzis = DateTime.Now.Date;
                var zatrudnieniOsobyIds = _context.Zatrudnienia
                    .Where(z => z.ZatrudnionyDo == null || z.ZatrudnionyDo >= dzis)
                    .Select(z => z.OsobaId)
                    .Distinct()
                    .ToList();
                osoby = osoby.Where(o => zatrudnieniOsobyIds.Contains(o.Id)).ToList();
            }

            // Filtrowanie na podstawie ograniczeń
            if (majaOgraniczenia.HasValue && majaOgraniczenia.Value)
            {
                var osobyZOgraniczeniami = _context.OgraniczeniaUprawnien
                    .Select(og => og.OsobaId)
                    .Distinct()
                    .ToList();
                osoby = osoby.Where(o => osobyZOgraniczeniami.Contains(o.Id)).ToList();
            }

            // Filtrowanie na podstawie wykształcenia
            if (!string.IsNullOrWhiteSpace(rodzajWyksztalcenia))
            {
                var rodzajLower = rodzajWyksztalcenia.ToLower();
                var osobyZWyksztalceniem = _context.Wyksztalcenia
                    .Where(w => w.RodzajWyksztalcenia != null && 
                                w.RodzajWyksztalcenia.ToLower().Contains(rodzajLower))
                    .Select(w => w.OsobaId)
                    .Distinct()
                    .ToList();
                osoby = osoby.Where(o => osobyZWyksztalceniem.Contains(o.Id)).ToList();
            }

            // Pobierz numer PWZ i typ personelu z uprawnień zawodowych dla każdej osoby
            var osobyIds = osoby.Select(o => o.Id).ToList();
            var wszystkieUprawnienia = _context.UprawnieniZawodowe
                .Where(u => osobyIds.Contains(u.OsobaId))
                .ToList();
            
            var uprawnienia = wszystkieUprawnienia
                .GroupBy(u => u.OsobaId)
                .ToDictionary(
                    g => g.Key,
                    g => {
                        var uprZPwz = g.FirstOrDefault(x => !string.IsNullOrEmpty(x.NpwzIdRizh));
                        var pierwsze = g.First();
                        return new {
                            NrPwz = uprZPwz?.NpwzIdRizh,
                            TypPersonelu = uprZPwz?.Rodzaj ?? pierwsze.Rodzaj
                        };
                    }
                );

            var result = osoby.Select(o => new {
                o.Id,
                o.Pesel,
                o.PlecId,
                o.DataUrodzenia,
                o.Nazwisko,
                o.Imie,
                o.Imie2,
                o.TypPersoneluId,
                NrPwz = uprawnienia.ContainsKey(o.Id) && uprawnienia[o.Id].NrPwz != null 
                    ? uprawnienia[o.Id].NrPwz 
                    : o.NrPwz,
                TypPersonelu = uprawnienia.ContainsKey(o.Id) && uprawnienia[o.Id].TypPersonelu != null
                    ? uprawnienia[o.Id].TypPersonelu
                    : null,
                o.NumerTelefonu,
                o.NumerTelefonuWew,
                o.AdresEmail,
                o.DataZgonu
            }).ToList();

            return Ok(result);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var osoba = GetOsobyWithFallback().FirstOrDefault(o => o.Id == id);
            if (osoba == null)
                return NotFound();
            
            // Pobierz typ personelu i numer PWZ z uprawnień zawodowych
            var uprawnienie = _context.UprawnieniZawodowe
                .FirstOrDefault(u => u.OsobaId == id);
            
            var result = new {
                osoba.Id,
                osoba.Pesel,
                osoba.PlecId,
                osoba.DataUrodzenia,
                osoba.Nazwisko,
                osoba.Imie,
                osoba.Imie2,
                osoba.TypPersoneluId,
                NrPwz = uprawnienie != null && !string.IsNullOrEmpty(uprawnienie.NpwzIdRizh) 
                    ? uprawnienie.NpwzIdRizh 
                    : osoba.NrPwz,
                TypPersonelu = uprawnienie?.Rodzaj,
                osoba.NumerTelefonu,
                osoba.NumerTelefonuWew,
                osoba.AdresEmail,
                osoba.DataZgonu
            };
            
            return Ok(result);
        }

        [HttpPost]
        public IActionResult Add(Osoba osoba)
        {
            // Walidacja numeru PWZ dla lekarzy
            var pwzError = PwzValidator.WalidujPwzDlaLekarza(osoba.NrPwz, osoba.TypPersoneluId);
            if (pwzError != null)
            {
                return BadRequest(new { error = pwzError });
            }

            _context.Osoby.Add(osoba);
            _context.SaveChanges();
            return Ok(osoba);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, Osoba osoba)
        {
            var existing = _context.Osoby.FirstOrDefault(o => o.Id == id);
            if (existing == null)
                return NotFound();

            // Walidacja numeru PWZ dla lekarzy
            var pwzError = PwzValidator.WalidujPwzDlaLekarza(osoba.NrPwz, osoba.TypPersoneluId);
            if (pwzError != null)
            {
                return BadRequest(new { error = pwzError });
            }

            existing.Imie = osoba.Imie;
            existing.Imie2 = osoba.Imie2;
            existing.Nazwisko = osoba.Nazwisko;
            existing.Pesel = osoba.Pesel;
            existing.DataUrodzenia = osoba.DataUrodzenia;
            existing.NrPwz = osoba.NrPwz;
            existing.NumerTelefonu = osoba.NumerTelefonu;
            existing.PlecId = osoba.PlecId;
            existing.TypPersoneluId = osoba.TypPersoneluId;

            try { existing.DataZgonu = osoba.DataZgonu; } catch { }

            _context.SaveChanges();
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var osoba = _context.Osoby.FirstOrDefault(o => o.Id == id);
            if (osoba == null)
                return NotFound("Osoba nie została znaleziona.");

            try
            {
                // Usuń miejsca pracy
                var miejscaPracy = _context.MiejscaPracy.Where(m => m.OsobaId == id).ToList();
                if (miejscaPracy.Any())
                {
                    _context.MiejscaPracy.RemoveRange(miejscaPracy);
                    _context.SaveChanges();
                }

                // Usuń powiązane rekordy - każdy typ osobno
                var zatrudnienia = _context.Zatrudnienia.Where(z => z.OsobaId == id).ToList();
                if (zatrudnienia.Any())
                {
                    _context.Zatrudnienia.RemoveRange(zatrudnienia);
                    _context.SaveChanges();
                }

                var wyksztalcenia = _context.Wyksztalcenia.Where(w => w.OsobaId == id).ToList();
                if (wyksztalcenia.Any())
                {
                    _context.Wyksztalcenia.RemoveRange(wyksztalcenia);
                    _context.SaveChanges();
                }

                var uprawnienia = _context.UprawnieniZawodowe.Where(u => u.OsobaId == id).ToList();
                if (uprawnienia.Any())
                {
                    _context.UprawnieniZawodowe.RemoveRange(uprawnienia);
                    _context.SaveChanges();
                }

                var ograniczenia = _context.OgraniczeniaUprawnien.Where(o => o.OsobaId == id).ToList();
                if (ograniczenia.Any())
                {
                    _context.OgraniczeniaUprawnien.RemoveRange(ograniczenia);
                    _context.SaveChanges();
                }

                var zawody = _context.ZawodySpecjalnosci.Where(z => z.OsobaId == id).ToList();
                if (zawody.Any())
                {
                    _context.ZawodySpecjalnosci.RemoveRange(zawody);
                    _context.SaveChanges();
                }

                var kompetencje = _context.KompetencjeUmiejetnosci.Where(k => k.OsobaId == id).ToList();
                if (kompetencje.Any())
                {
                    _context.KompetencjeUmiejetnosci.RemoveRange(kompetencje);
                    _context.SaveChanges();
                }

                var doswiadczenie = _context.DoswiadczenieZawodowe.Where(d => d.OsobaId == id).ToList();
                if (doswiadczenie.Any())
                {
                    _context.DoswiadczenieZawodowe.RemoveRange(doswiadczenie);
                    _context.SaveChanges();
                }

                // Usuń powiązania użytkowników (ustaw osoba_id na NULL zamiast usuwać)
                var dbUsers = _context.DbUsers.Where(u => u.OsobaId == id).ToList();
                foreach (var user in dbUsers)
                {
                    user.OsobaId = 0;
                }
                if (dbUsers.Any())
                {
                    _context.SaveChanges();
                }

                // Na końcu usuń osobę
                _context.Osoby.Remove(osoba);
                _context.SaveChanges();

                return Ok(new { message = "Osoba została usunięta wraz z powiązanymi danymi." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Błąd podczas usuwania: {ex.Message}");
            }
        }
    }
}
