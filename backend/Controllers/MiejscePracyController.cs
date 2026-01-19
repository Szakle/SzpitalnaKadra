using Microsoft.AspNetCore.Mvc;
using SzpitalnaKadra.Data;
using SzpitalnaKadra.Models;

namespace SzpitalnaKadra.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MiejscePracyController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MiejscePracyController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("slownik/funkcje")]
        public IActionResult GetSlownikFunkcji()
        {
            var funkcje = _context.DFunkcjeMiejsce.OrderBy(f => f.Kod).ToList();
            return Ok(funkcje);
        }

        [HttpGet("slownik/miejsca")]
        public IActionResult GetSlownikMiejsc()
        {
            var miejsca = _context.DMiejscaUdzielaniaSwiadczen.OrderBy(m => m.Nazwa).ToList();
            return Ok(miejsca);
        }

        [HttpGet("osoba/{osobaId}")]
        public IActionResult GetByOsobaId(int osobaId)
        {
            var miejscaPracy = _context.MiejscaPracy.Where(m => m.OsobaId == osobaId).ToList();
            return Ok(miejscaPracy);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var miejscePracy = _context.MiejscaPracy.FirstOrDefault(m => m.Id == id);
            if (miejscePracy == null)
                return NotFound();
            return Ok(miejscePracy);
        }

        [HttpPost]
        public IActionResult Add(MiejscePracy miejscePracy)
        {
            // Konwersja dat na UTC dla PostgreSQL
            if (miejscePracy.PracaOd.HasValue)
                miejscePracy.PracaOd = DateTime.SpecifyKind(miejscePracy.PracaOd.Value, DateTimeKind.Utc);
            if (miejscePracy.PracaDo.HasValue)
                miejscePracy.PracaDo = DateTime.SpecifyKind(miejscePracy.PracaDo.Value, DateTimeKind.Utc);
            
            miejscePracy.CreatedAt = DateTime.UtcNow;
            miejscePracy.UpdatedAt = DateTime.UtcNow;
            _context.MiejscaPracy.Add(miejscePracy);
            _context.SaveChanges();
            return Ok(miejscePracy);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, MiejscePracy miejscePracy)
        {
            var existing = _context.MiejscaPracy.FirstOrDefault(m => m.Id == id);
            if (existing == null)
                return NotFound();

            existing.KodMiejscaUdzielaniaSwiadczen = miejscePracy.KodMiejscaUdzielaniaSwiadczen;
            existing.NazwaMiejscaUdzielaniaSwiadczen = miejscePracy.NazwaMiejscaUdzielaniaSwiadczen;
            existing.KodSpecjalnosci = miejscePracy.KodSpecjalnosci;
            existing.NazwaSpecjalnosci = miejscePracy.NazwaSpecjalnosci;
            existing.ZawodSpecjalnosc = miejscePracy.ZawodSpecjalnosc;
            existing.KodFunkcji = miejscePracy.KodFunkcji;
            existing.NazwaFunkcji = miejscePracy.NazwaFunkcji;
            existing.RodzajZatrudnienia = miejscePracy.RodzajZatrudnienia;
            existing.Bezterminowo = miejscePracy.Bezterminowo;
            
            // Konwersja dat na UTC dla PostgreSQL
            if (miejscePracy.PracaOd.HasValue)
                existing.PracaOd = DateTime.SpecifyKind(miejscePracy.PracaOd.Value, DateTimeKind.Utc);
            else
                existing.PracaOd = null;
            if (miejscePracy.PracaDo.HasValue)
                existing.PracaDo = DateTime.SpecifyKind(miejscePracy.PracaDo.Value, DateTimeKind.Utc);
            else
                existing.PracaDo = null;
                
            existing.TypHarmonogramu = miejscePracy.TypHarmonogramu;
            existing.UpdatedAt = DateTime.UtcNow;

            _context.SaveChanges();
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var miejscePracy = _context.MiejscaPracy.FirstOrDefault(m => m.Id == id);
            if (miejscePracy == null)
                return NotFound();

            _context.MiejscaPracy.Remove(miejscePracy);
            _context.SaveChanges();
            return Ok(new { message = "Miejsce pracy zostało usunięte" });
        }
    }
}
