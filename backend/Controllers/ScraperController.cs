using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;
using SzpitalnaKadra.Data;
using SzpitalnaKadra.Models;

namespace SzpitalnaKadra.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ScraperController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ScraperController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpPost("run")]
        public async Task<IActionResult> RunScraper()
        {
            try
            {
                // 1. Ustal ścieżki
                // Zakładamy, że struktura to:
                // root/
                //   szoi_scraper.py
                //   SzpitalBackend/
                //   ...
                
                string contentRootPath = _env.ContentRootPath; // SzpitalBackend folder
                // Use robust relative pathing instead of GetParent
                string solutionRootPath = Path.GetFullPath(Path.Combine(contentRootPath, ".."));
                string scriptPath = Path.Combine(solutionRootPath, "szoi_scraper.py");
                string jsonOutputPath = Path.Combine(solutionRootPath, "employees_import.json");

                // DEBUG: Check paths
                if (!System.IO.File.Exists(scriptPath))
                {
                    return StatusCode(500, $"FATAL: Script file not found at: {scriptPath}. ContentRoot: {contentRootPath}");
                }

                // Determine Python interpreter
                string pythonExe = "python";
                string venvPython = Path.Combine(solutionRootPath, "venv", "Scripts", "python.exe");
                if (System.IO.File.Exists(venvPython))
                {
                    pythonExe = venvPython;
                }

                // 2. Uruchom skrypt Python
                var startInfo = new ProcessStartInfo
                {
                    FileName = pythonExe, 
                    Arguments = $"\"{scriptPath}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WorkingDirectory = solutionRootPath // Pli json powstanie w root
                };

                using (var process = Process.Start(startInfo))
                {
                    if (process == null) return StatusCode(500, "Failed to start scraper process.");
                    
                    // Opcjonalnie czytaj stdout/stderr do logów
                    string stderr = await process.StandardError.ReadToEndAsync();
                    
                    await process.WaitForExitAsync();

                    if (process.ExitCode != 0)
                    {
                        Console.WriteLine($"[Scraper Error] ExitCode: {process.ExitCode}");
                        Console.WriteLine($"[Scraper Stderr]: {stderr}");
                        return StatusCode(500, $"Scraper failed. Error: {stderr}");
                    }
                }

                // 3. Przeczytaj JSON
                if (!System.IO.File.Exists(jsonOutputPath))
                {
                    return NotFound("Scraper finished but no output file found.");
                }

                string jsonContent = await System.IO.File.ReadAllTextAsync(jsonOutputPath);
                
                // Konfiguracja do deserializacji snake_case -> PascalCase jeśli trzeba, 
                // ale tu mamy niestandardowe mapowanie, więc użyjemy DTO.
                var options = new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = JsonNumberHandling.AllowReadingFromString 
                };
                
                var importedData = JsonSerializer.Deserialize<List<ScraperDto>>(jsonContent, options);

                if (importedData == null || !importedData.Any())
                {
                     return Ok("No data imported.");
                }

                // Fix sequences in case they are out of sync
                try 
                {
                    await _context.Database.ExecuteSqlRawAsync("SELECT setval(pg_get_serial_sequence('osoba', 'id'), coalesce(max(id),0) + 1, false) FROM osoba;");
                    await _context.Database.ExecuteSqlRawAsync("SELECT setval(pg_get_serial_sequence('zatrudnienie', 'id'), coalesce(max(id),0) + 1, false) FROM zatrudnienie;");
                    await _context.Database.ExecuteSqlRawAsync("SELECT setval(pg_get_serial_sequence('uprawnienia_zawodowe', 'id'), coalesce(max(id),0) + 1, false) FROM uprawnienia_zawodowe;");
                    await _context.Database.ExecuteSqlRawAsync("SELECT setval(pg_get_serial_sequence('wyksztalcenie', 'id'), coalesce(max(id),0) + 1, false) FROM wyksztalcenie;");
                    await _context.Database.ExecuteSqlRawAsync("SELECT setval(pg_get_serial_sequence('zawody_specjalnosci', 'id'), coalesce(max(id),0) + 1, false) FROM zawody_specjalnosci;");
                    await _context.Database.ExecuteSqlRawAsync("SELECT setval(pg_get_serial_sequence('doswiadczenie_zawodowe', 'id'), coalesce(max(id),0) + 1, false) FROM doswiadczenie_zawodowe;");
                } 
                catch (Exception ex) 
                {
                    Console.WriteLine($"Sequence reset warning: {ex.Message}");
                }
                
                // 4. Zapis do bazy
                int addedCount = 0;
                int updatedCount = 0;
                var addedPersons = new List<PersonReportItem>();
                var updatedPersons = new List<PersonReportItem>();
                var errorPersons = new List<ErrorReportItem>();

                foreach (var item in importedData)
                {
                    if (item.Osoba == null || string.IsNullOrEmpty(item.Osoba.Pesel)) continue;

                    try
                    {
                    var pesel = item.Osoba.Pesel;
                    var existingOsoba = await _context.Osoby.FirstOrDefaultAsync(o => o.Pesel == pesel);
                    
                    Osoba osobaEntity;

                    if (existingOsoba == null)
                    {
                        // Nowa osoba
                        osobaEntity = new Osoba
                        {
                            Pesel = item.Osoba.Pesel,
                            Imie = item.Osoba.Imie,
                            Imie2 = item.Osoba.Imie2 ?? string.Empty,
                            Nazwisko = item.Osoba.Nazwisko,
                            NumerTelefonu = item.Osoba.NumerTelefonu,
                            TypPersoneluId = item.Osoba.TypPersoneluId ?? 1, // Default to 1 (Inny) if mapping fails
                            NrPwz = string.IsNullOrEmpty(item.Osoba.NrPwz) ? null : item.Osoba.NrPwz,
                            PlecId = DetermineSexFromPesel(item.Osoba.Pesel),
                            DataUrodzenia = ParsePeselDate(item.Osoba.Pesel)
                        };
                        
                        if (!string.IsNullOrEmpty(item.Osoba.DataZgonu))
                        {
                            if (DateTime.TryParse(item.Osoba.DataZgonu, out var dz))
                                osobaEntity.DataZgonu = dz;
                        }

                        _context.Osoby.Add(osobaEntity);
                        await _context.SaveChangesAsync(); // Save to get ID
                        addedCount++;
                        addedPersons.Add(new PersonReportItem
                        {
                            Id = osobaEntity.Id,
                            Pesel = osobaEntity.Pesel,
                            Imie = osobaEntity.Imie,
                            Nazwisko = osobaEntity.Nazwisko,
                            NrPwz = osobaEntity.NrPwz,
                            TypPersoneluId = osobaEntity.TypPersoneluId
                        });
                    }
                    else
                    {
                        // Update
                        osobaEntity = existingOsoba;
                        osobaEntity.Imie = item.Osoba.Imie;
                        osobaEntity.Imie2 = item.Osoba.Imie2 ?? string.Empty;
                        osobaEntity.Nazwisko = item.Osoba.Nazwisko;
                        osobaEntity.NumerTelefonu = item.Osoba.NumerTelefonu;
                        osobaEntity.TypPersoneluId = item.Osoba.TypPersoneluId ?? osobaEntity.TypPersoneluId;
                        osobaEntity.NrPwz = item.Osoba.NrPwz ?? osobaEntity.NrPwz;
                         if (!string.IsNullOrEmpty(item.Osoba.DataZgonu))
                        {
                            if (DateTime.TryParse(item.Osoba.DataZgonu, out var dz))
                                osobaEntity.DataZgonu = dz;
                        }
                        
                        updatedCount++;
                        updatedPersons.Add(new PersonReportItem
                        {
                            Id = osobaEntity.Id,
                            Pesel = osobaEntity.Pesel,
                            Imie = osobaEntity.Imie,
                            Nazwisko = osobaEntity.Nazwisko,
                            NrPwz = osobaEntity.NrPwz,
                            TypPersoneluId = osobaEntity.TypPersoneluId
                        });
                    }

                    // Zatrudnienie
                    if (item.Zatrudnienie != null)
                    {
                         var existingZatr = await _context.Zatrudnienia.FirstOrDefaultAsync(z => z.OsobaId == osobaEntity.Id);
                         if (existingZatr == null)
                         {
                             var zatr = new Zatrudnienie
                             {
                                 OsobaId = osobaEntity.Id,
                                 ZatrudnienieDeklaracja = item.Zatrudnienie.ZatrudnienieDeklaracja,
                                 ZatrudnionyOd = ParseDate(item.Zatrudnienie.ZatrudnionyOd),
                                 ZatrudnionyDo = ParseDate(item.Zatrudnienie.ZatrudnionyDo),
                                 SrednioczasowyCzasPracy = item.Zatrudnienie.SrednioczasowyCzasPracy,
                                 CreatedAt = DateTime.UtcNow
                             };
                             _context.Zatrudnienia.Add(zatr);
                         }
                         else
                         {
                             existingZatr.ZatrudnienieDeklaracja = item.Zatrudnienie.ZatrudnienieDeklaracja;
                             existingZatr.ZatrudnionyOd = ParseDate(item.Zatrudnienie.ZatrudnionyOd);
                             existingZatr.ZatrudnionyDo = ParseDate(item.Zatrudnienie.ZatrudnionyDo);
                             existingZatr.SrednioczasowyCzasPracy = item.Zatrudnienie.SrednioczasowyCzasPracy;
                             existingZatr.UpdatedAt = DateTime.UtcNow;
                         }
                    }

                    // Uprawnienia
                     if (item.UprawnieniaZawodowe != null)
                     {
                         foreach(var u in item.UprawnieniaZawodowe)
                         {
                             // Check dupl
                             bool exists = await _context.UprawnieniZawodowe.AnyAsync(x => x.OsobaId == osobaEntity.Id && x.NpwzIdRizh == u.NpwzIdRizh);
                             if(!exists)
                             {
                                 _context.UprawnieniZawodowe.Add(new UprawnieniZawodowe
                                 {
                                     OsobaId = osobaEntity.Id,
                                     Rodzaj = u.Rodzaj ?? string.Empty,
                                     NpwzIdRizh = u.NpwzIdRizh ?? string.Empty,
                                     OrganRejestrujacy = u.OrganRejestrujacy ?? string.Empty,
                                     DataUzyciaUprawnienia = ParseDate(u.DataUzyciaUprawnienia)
                                 });
                             }
                         }
                     }

                    // Wyksztalcenie
                    if (item.Wyksztalcenie != null)
                    {
                        foreach(var w in item.Wyksztalcenie)
                        {
                             var rodzaj = Truncate(w.RodzajWyksztalcenia, 255);
                             var kierunek = Truncate(w.Kierunek, 255);
                             var uczelnia = Truncate(w.Uczelnia, 255);
                             var dyplom = Truncate(w.Dyplom, 255);
                             
                             // Check duplicate by rodzaj + kierunek + uczelnia
                             bool exists = await _context.Wyksztalcenia.AnyAsync(x => 
                                 x.OsobaId == osobaEntity.Id && 
                                 x.RodzajWyksztalcenia == rodzaj &&
                                 x.Kierunek == kierunek);
                             if (!exists)
                             {
                                 _context.Wyksztalcenia.Add(new Wyksztalcenie
                                 {
                                     OsobaId = osobaEntity.Id,
                                     RodzajWyksztalcenia = rodzaj,
                                     Kierunek = kierunek,
                                     Uczelnia = uczelnia,
                                     DataUkonczenia = ParseDate(w.DataUkonczenia),
                                     Dyplom = dyplom
                                 });
                             }
                        }
                    }

                    // Zawody
                    if (item.ZawodySpecjalnosci != null)
                    {
                        foreach(var z in item.ZawodySpecjalnosci)
                        {
                             bool exists = await _context.ZawodySpecjalnosci.AnyAsync(x => x.OsobaId == osobaEntity.Id && x.Kod == z.Kod);
                             if (!exists)
                             {
                                 _context.ZawodySpecjalnosci.Add(new ZawodySpecjalnosci
                                 {
                                     OsobaId = osobaEntity.Id,
                                     Kod = z.Kod ?? string.Empty,
                                     Nazwa = z.Nazwa ?? string.Empty,
                                     StopienSpecjalizacji = z.StopienSpecjalizacji ?? string.Empty,
                                     DataOtwarciaSpecjalizacji = ParseDate(z.DataOtwarciaSpecjalizacji),
                                     // DataUzyskaniaSpecjalizacji = ParseDate(z.DataUzyskaniaSpecjalizacji), // Column missing in DB
                                     Dyplom = z.Dyplom ?? string.Empty
                                 });
                             }
                        }
                    }
                    
                    // Doswiadczenie
                     if (item.DoswiadczenieZawodowe != null)
                    {
                        foreach(var d in item.DoswiadczenieZawodowe)
                        {
                             bool exists = await _context.DoswiadczenieZawodowe.AnyAsync(x => x.OsobaId == osobaEntity.Id && x.Kod == d.Kod);
                             if (!exists)
                             {
                                 _context.DoswiadczenieZawodowe.Add(new DoswiadczenieZawodowe
                                 {
                                     OsobaId = osobaEntity.Id,
                                     Kod = d.Kod ?? string.Empty,
                                     Nazwa = d.Nazwa ?? string.Empty,
                                     Zaswiadczenie = d.Zaswiadczenie ?? string.Empty
                                 });
                             }
                        }
                    }

                    await _context.SaveChangesAsync();
                    }
                    catch (Exception personEx)
                    {
                        // Rollback changes for this person
                        foreach (var entry in _context.ChangeTracker.Entries().Where(e => e.State != EntityState.Unchanged))
                        {
                            entry.State = EntityState.Detached;
                        }
                        
                        var innerMsg = personEx.InnerException?.Message ?? personEx.Message;
                        Console.WriteLine($"[Import Error] PESEL: {item.Osoba?.Pesel}, Error: {innerMsg}");
                        errorPersons.Add(new ErrorReportItem
                        {
                            Pesel = item.Osoba?.Pesel ?? "unknown",
                            Imie = item.Osoba?.Imie ?? "",
                            Nazwisko = item.Osoba?.Nazwisko ?? "",
                            Error = innerMsg
                        });
                    }
                }

                // Tworzenie raportu i zapis do historii
                var report = new ImportReport
                {
                    Id = Guid.NewGuid().ToString(),
                    Timestamp = DateTime.UtcNow,
                    AddedCount = addedCount,
                    UpdatedCount = updatedCount,
                    TotalProcessed = importedData.Count,
                    ErrorCount = errorPersons.Count,
                    AddedPersons = addedPersons,
                    UpdatedPersons = updatedPersons,
                    ErrorPersons = errorPersons
                };

                // Zapisz raport do pliku historii
                string reportsDir = Path.Combine(solutionRootPath, "import_reports");
                Directory.CreateDirectory(reportsDir);
                string reportFileName = $"report_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json";
                string reportPath = Path.Combine(reportsDir, reportFileName);
                
                var reportJson = JsonSerializer.Serialize(report, new JsonSerializerOptions { WriteIndented = true });
                await System.IO.File.WriteAllTextAsync(reportPath, reportJson);

                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message} \n {ex.StackTrace}");
            }
        }

        [HttpPost("fix-pwz-trigger")]
        public async Task<IActionResult> FixPwzTrigger()
        {
            try
            {
                var sql = @"
                    CREATE OR REPLACE FUNCTION public.waliduj_pwz_trigger() 
                    RETURNS trigger
                    LANGUAGE plpgsql
                    AS $$
                    BEGIN
                        -- Pomijamy walidację jeśli numer jest pusty/null
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
                ";
                
                await _context.Database.ExecuteSqlRawAsync(sql);
                return Ok(new { message = "Trigger walidacji PWZ został zaktualizowany. Teraz numery pielęgniarek/położnych nie są walidowane." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Błąd: {ex.Message}");
            }
        }

        [HttpGet("reports")]
        public async Task<IActionResult> GetReportsHistory()
        {
            try
            {
                string contentRootPath = _env.ContentRootPath;
                string solutionRootPath = Path.GetFullPath(Path.Combine(contentRootPath, ".."));
                string reportsDir = Path.Combine(solutionRootPath, "import_reports");

                if (!Directory.Exists(reportsDir))
                {
                    return Ok(new List<ImportReportSummary>());
                }

                var reports = new List<ImportReportSummary>();
                var files = Directory.GetFiles(reportsDir, "report_*.json")
                    .OrderByDescending(f => f)
                    .Take(20); // Ostatnie 20 raportów

                foreach (var file in files)
                {
                    var json = await System.IO.File.ReadAllTextAsync(file);
                    var report = JsonSerializer.Deserialize<ImportReport>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (report != null)
                    {
                        reports.Add(new ImportReportSummary
                        {
                            Id = report.Id,
                            Timestamp = report.Timestamp,
                            AddedCount = report.AddedCount,
                            UpdatedCount = report.UpdatedCount,
                            TotalProcessed = report.TotalProcessed,
                            FileName = Path.GetFileName(file)
                        });
                    }
                }

                return Ok(reports);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error loading reports: {ex.Message}");
            }
        }

        [HttpGet("reports/{id}")]
        public async Task<IActionResult> GetReportById(string id)
        {
            try
            {
                string contentRootPath = _env.ContentRootPath;
                string solutionRootPath = Path.GetFullPath(Path.Combine(contentRootPath, ".."));
                string reportsDir = Path.Combine(solutionRootPath, "import_reports");

                if (!Directory.Exists(reportsDir))
                {
                    return NotFound("No reports found.");
                }

                var files = Directory.GetFiles(reportsDir, "report_*.json");
                foreach (var file in files)
                {
                    var json = await System.IO.File.ReadAllTextAsync(file);
                    var report = JsonSerializer.Deserialize<ImportReport>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (report != null && report.Id == id)
                    {
                        return Ok(report);
                    }
                }

                return NotFound($"Report with ID {id} not found.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error loading report: {ex.Message}");
            }
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetSzoiSettings()
        {
            try
            {
                string contentRootPath = _env.ContentRootPath;
                string solutionRootPath = Path.GetFullPath(Path.Combine(contentRootPath, ".."));
                string settingsPath = Path.Combine(solutionRootPath, "szoi_settings.json");

                if (!System.IO.File.Exists(settingsPath))
                {
                    // Zwróć domyślne ustawienia
                    return Ok(new SzoiSettingsDto());
                }

                var json = await System.IO.File.ReadAllTextAsync(settingsPath);
                var settings = JsonSerializer.Deserialize<SzoiSettingsDto>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return Ok(settings ?? new SzoiSettingsDto());
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error loading settings: {ex.Message}");
            }
        }

        [HttpPost("settings")]
        public async Task<IActionResult> SaveSzoiSettings([FromBody] SzoiSettingsDto settings)
        {
            try
            {
                string contentRootPath = _env.ContentRootPath;
                string solutionRootPath = Path.GetFullPath(Path.Combine(contentRootPath, ".."));
                string settingsPath = Path.Combine(solutionRootPath, "szoi_settings.json");
                string scraperPath = Path.Combine(solutionRootPath, "szoi_scraper.py");

                // Zapisz ustawienia do JSON
                var json = JsonSerializer.Serialize(settings, new JsonSerializerOptions { WriteIndented = true });
                await System.IO.File.WriteAllTextAsync(settingsPath, json);

                // Zaktualizuj skrypt Python
                if (System.IO.File.Exists(scraperPath))
                {
                    var scriptContent = await System.IO.File.ReadAllTextAsync(scraperPath);
                    
                    // Zaktualizuj BASE_URL
                    scriptContent = System.Text.RegularExpressions.Regex.Replace(
                        scriptContent,
                        @"BASE_URL\s*=\s*""[^""]*""",
                        $"BASE_URL = \"{settings.SzoiUrl}\""
                    );

                    // Zaktualizuj LIMIT_EMPLOYEES
                    string limitValue = settings.FetchAll ? "None" : (settings.RecordLimit?.ToString() ?? "20");
                    scriptContent = System.Text.RegularExpressions.Regex.Replace(
                        scriptContent,
                        @"LIMIT_EMPLOYEES[^=]*=\s*\S+",
                        $"LIMIT_EMPLOYEES: Optional[int] = {limitValue}"
                    );

                    await System.IO.File.WriteAllTextAsync(scraperPath, scriptContent);
                }

                return Ok(new { message = "Ustawienia zostały zapisane." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error saving settings: {ex.Message}");
            }
        }

        private int DetermineSexFromPesel(string pesel)
        {
            if (string.IsNullOrEmpty(pesel) || pesel.Length != 11) return 1; // Default male? or unknown
            int digit = int.Parse(pesel[9].ToString());
            return (digit % 2 == 0) ? 2 : 1; // 0,2,4,6,8 -> K (2), 1,3,5,7,9 -> M (1) (Założenie ID płci: 1-M, 2-K)
        }

        private DateTime? ParsePeselDate(string pesel)
        {
             if (string.IsNullOrEmpty(pesel) || pesel.Length != 11) return null;
             int year = int.Parse(pesel.Substring(0, 2));
             int month = int.Parse(pesel.Substring(2, 2));
             int day = int.Parse(pesel.Substring(4, 2));

             int fullYear = 1900 + year;
             if (month > 80) { fullYear = 1800 + year; month -= 80; }
             else if (month > 60) { fullYear = 2200 + year; month -= 60; }
             else if (month > 40) { fullYear = 2100 + year; month -= 40; }
             else if (month > 20) { fullYear = 2000 + year; month -= 20; }
             
             try { return DateTime.SpecifyKind(new DateTime(fullYear, month, day), DateTimeKind.Utc); } catch { return null; }
        }

        private DateTime? ParseDate(string? s)
        {
            if (string.IsNullOrWhiteSpace(s)) return null;
            if (DateTime.TryParse(s, out var d)) 
            {
                // PostgreSQL wymaga UTC dla timestamp with time zone
                return DateTime.SpecifyKind(d, DateTimeKind.Utc);
            }
            return null;
        }

        private string Truncate(string? s, int maxLength)
        {
            if (string.IsNullOrEmpty(s)) return string.Empty;
            return s.Length <= maxLength ? s : s.Substring(0, maxLength);
        }

        // DTO classes
        public class ScraperDto
        {
            [JsonPropertyName("osoba")] public OsobaDto Osoba { get; set; }
            [JsonPropertyName("zatrudnienie")] public ZatrudnienieDto Zatrudnienie { get; set; }
            [JsonPropertyName("uprawnienia_zawodowe")] public List<UprawnienieDto> UprawnieniaZawodowe { get; set; }
            [JsonPropertyName("wyksztalcenie")] public List<WyksztalcenieDto> Wyksztalcenie { get; set; }
            [JsonPropertyName("zawody_specjalnosci")] public List<ZawodDto> ZawodySpecjalnosci { get; set; }
            [JsonPropertyName("doswiadczenie_zawodowe")] public List<DoswiadczenieDto> DoswiadczenieZawodowe { get; set; }
        }

        public class OsobaDto
        {
            [JsonPropertyName("pesel")] public string Pesel { get; set; }
            [JsonPropertyName("imie")] public string Imie { get; set; }
            [JsonPropertyName("imie2")] public string? Imie2 { get; set; }
            [JsonPropertyName("nazwisko")] public string Nazwisko { get; set; }
            [JsonPropertyName("numer_telefonu")] public string? NumerTelefonu { get; set; }
            [JsonPropertyName("data_zgonu")] public string? DataZgonu { get; set; }
            [JsonPropertyName("nr_pwz")] public string? NrPwz { get; set; }
            [JsonPropertyName("typ_personelu_id")] public int? TypPersoneluId { get; set; }
        }

        public class ZatrudnienieDto
        {
            [JsonPropertyName("zatrudnienie_deklaracja")] public string? ZatrudnienieDeklaracja { get; set; }
            [JsonPropertyName("zatrudniony_od")] public string? ZatrudnionyOd { get; set; }
            [JsonPropertyName("zatrudniony_do")] public string? ZatrudnionyDo { get; set; }
            [JsonPropertyName("srednioczasowy_czas_pracy")] public string? SrednioczasowyCzasPracy { get; set; }
        }

        public class UprawnienieDto
        {
            [JsonPropertyName("rodzaj")] public string? Rodzaj { get; set; }
            [JsonPropertyName("npwz_id_rizh")] public string? NpwzIdRizh { get; set; }
            [JsonPropertyName("organ_rejestrujacy")] public string? OrganRejestrujacy { get; set; }
            [JsonPropertyName("data_uzycia_uprawnienia")] public string? DataUzyciaUprawnienia { get; set; }
        }

        public class ZawodDto
        {
            [JsonPropertyName("kod")] public string? Kod { get; set; }
            [JsonPropertyName("nazwa")] public string? Nazwa { get; set; }
            [JsonPropertyName("stopien_specjalizacji")] public string? StopienSpecjalizacji { get; set; }
            [JsonPropertyName("data_otwarcia_specjalizacji")] public string? DataOtwarciaSpecjalizacji { get; set; }
            [JsonPropertyName("data_uzyskania_specjalizacji")] public string? DataUzyskaniaSpecjalizacji { get; set; }
            [JsonPropertyName("dyplom")] public string? Dyplom { get; set; }
        }

        public class DoswiadczenieDto
        {
            [JsonPropertyName("kod")] public string? Kod { get; set; }
            [JsonPropertyName("nazwa")] public string? Nazwa { get; set; }
            [JsonPropertyName("zaswiadczenie")] public string? Zaswiadczenie { get; set; }
        }

        public class WyksztalcenieDto
        {
            [JsonPropertyName("rodzaj_wyksztalcenia")] public string? RodzajWyksztalcenia { get; set; }
            [JsonPropertyName("kierunek")] public string? Kierunek { get; set; }
            [JsonPropertyName("uczelnia")] public string? Uczelnia { get; set; }
            [JsonPropertyName("data_ukonczenia")] public string? DataUkonczenia { get; set; }
            [JsonPropertyName("dyplom")] public string? Dyplom { get; set; }
        }

        // Klasy raportów
        public class PersonReportItem
        {
            public int Id { get; set; }
            public string Pesel { get; set; } = string.Empty;
            public string Imie { get; set; } = string.Empty;
            public string Nazwisko { get; set; } = string.Empty;
            public string? NrPwz { get; set; }
            public int TypPersoneluId { get; set; }
        }

        public class ErrorReportItem
        {
            public string Pesel { get; set; } = string.Empty;
            public string Imie { get; set; } = string.Empty;
            public string Nazwisko { get; set; } = string.Empty;
            public string Error { get; set; } = string.Empty;
        }

        public class ImportReport
        {
            public string Id { get; set; } = string.Empty;
            public DateTime Timestamp { get; set; }
            public int AddedCount { get; set; }
            public int UpdatedCount { get; set; }
            public int ErrorCount { get; set; }
            public int TotalProcessed { get; set; }
            public List<PersonReportItem> AddedPersons { get; set; } = new();
            public List<PersonReportItem> UpdatedPersons { get; set; } = new();
            public List<ErrorReportItem> ErrorPersons { get; set; } = new();
        }

        public class ImportReportSummary
        {
            public string Id { get; set; } = string.Empty;
            public DateTime Timestamp { get; set; }
            public int AddedCount { get; set; }
            public int UpdatedCount { get; set; }
            public int TotalProcessed { get; set; }
            public string FileName { get; set; } = string.Empty;
        }

        public class SzoiSettingsDto
        {
            public string SzoiUrl { get; set; } = "https://szoi-test.nfz-lublin.pl";
            public int? RecordLimit { get; set; } = 20;
            public bool FetchAll { get; set; } = false;
        }
    }
}
