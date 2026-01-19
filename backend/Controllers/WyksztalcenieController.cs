using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SzpitalnaKadra.Data;
using SzpitalnaKadra.Models;

namespace SzpitalnaKadra.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WyksztalcenieController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WyksztalcenieController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("osoba/{osobaId}")]
        public ActionResult<IEnumerable<Wyksztalcenie>> GetByOsobaId(int osobaId)
        {
            Console.WriteLine($"Pobieranie wykształcenia dla osoby ID: {osobaId}");
            
            var wyksztalcenia = _context.Wyksztalcenia
                .Where(w => w.OsobaId == osobaId)
                .ToList();

            Console.WriteLine($"Znaleziono {wyksztalcenia.Count} rekordów dla osoby {osobaId}");
            foreach (var w in wyksztalcenia)
            {
                Console.WriteLine($"  ID: {w.Id}, OsobaId: {w.OsobaId}, Rodzaj: {w.RodzajWyksztalcenia}");
            }

            return Ok(wyksztalcenia);
        }

        [HttpGet("{id}")]
        public ActionResult<Wyksztalcenie> GetById(int id)
        {
            var wyksztalcenie = _context.Wyksztalcenia.Find(id);
            if (wyksztalcenie == null)
                return NotFound();
            
            return Ok(wyksztalcenie);
        }

        [HttpPost]
        public ActionResult<Wyksztalcenie> Create(Wyksztalcenie wyksztalcenie)
        {
            if (wyksztalcenie.DataUkonczenia.HasValue)
            {
                wyksztalcenie.DataUkonczenia = DateTime.SpecifyKind(wyksztalcenie.DataUkonczenia.Value, DateTimeKind.Utc);
            }
            
            _context.Wyksztalcenia.Add(wyksztalcenie);
            _context.SaveChanges();
            return CreatedAtAction(nameof(GetById), new { id = wyksztalcenie.Id }, wyksztalcenie);
        }

        [HttpPut("{id}")]
        public ActionResult<Wyksztalcenie> Update(int id, Wyksztalcenie wyksztalcenie)
        {
            var existing = _context.Wyksztalcenia.Find(id);
            if (existing == null)
                return NotFound();

            existing.RodzajWyksztalcenia = wyksztalcenie.RodzajWyksztalcenia;
            existing.Kierunek = wyksztalcenie.Kierunek;
            existing.Uczelnia = wyksztalcenie.Uczelnia;
            
            if (wyksztalcenie.DataUkonczenia.HasValue)
            {
                existing.DataUkonczenia = DateTime.SpecifyKind(wyksztalcenie.DataUkonczenia.Value, DateTimeKind.Utc);
            }
            else
            {
                existing.DataUkonczenia = null;
            }
            
            existing.Dyplom = wyksztalcenie.Dyplom;

            _context.SaveChanges();
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public ActionResult Delete(int id)
        {
            var wyksztalcenie = _context.Wyksztalcenia.Find(id);
            if (wyksztalcenie == null)
                return NotFound();

            _context.Wyksztalcenia.Remove(wyksztalcenie);
            _context.SaveChanges();
            return NoContent();
        }

        [HttpGet("options/rodzaj")]
        public ActionResult<IEnumerable<string>> GetRodzajeWyksztalcenia()
        {
            var rodzaje = _context.Wyksztalcenia
                .Where(w => !string.IsNullOrEmpty(w.RodzajWyksztalcenia))
                .Select(w => w.RodzajWyksztalcenia)
                .Distinct()
                .OrderBy(r => r)
                .ToList();
            
            return Ok(rodzaje);
        }

        // Nowy endpoint - pobiera rodzaje wykształcenia ze słownika SZOI
        [HttpGet("slownik/rodzaj")]
        public ActionResult<IEnumerable<object>> GetSlownikRodzajeWyksztalcenia()
        {
            var rodzaje = _context.DRodzajeWyksztalcenia
                .Where(r => r.Aktywny)
                .OrderBy(r => r.Kod)
                .Select(r => new { r.Id, r.Kod, r.Nazwa })
                .ToList();
            
            return Ok(rodzaje);
        }

        [HttpGet("options/kierunek")]
        public ActionResult<IEnumerable<string>> GetKierunki()
        {
            var kierunki = _context.Wyksztalcenia
                .Where(w => !string.IsNullOrEmpty(w.Kierunek))
                .Select(w => w.Kierunek)
                .Distinct()
                .OrderBy(k => k)
                .ToList();
            
            return Ok(kierunki);
        }

        [HttpGet("options/uczelnia")]
        public ActionResult<IEnumerable<string>> GetUczelnie()
        {
            var uczelnie = _context.Wyksztalcenia
                .Where(w => !string.IsNullOrEmpty(w.Uczelnia))
                .Select(w => w.Uczelnia)
                .Distinct()
                .OrderBy(u => u)
                .ToList();
            
            return Ok(uczelnie);
        }

        [HttpGet("options/dyplom")]
        public ActionResult<IEnumerable<string>> GetDyplomy()
        {
            var dyplomy = _context.Wyksztalcenia
                .Where(w => !string.IsNullOrEmpty(w.Dyplom))
                .Select(w => w.Dyplom)
                .Distinct()
                .OrderBy(d => d)
                .ToList();
            
            return Ok(dyplomy);
        }
    }
}
