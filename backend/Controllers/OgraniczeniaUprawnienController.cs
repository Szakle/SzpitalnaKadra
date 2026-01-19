using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SzpitalnaKadra.Data;
using SzpitalnaKadra.Models;

namespace SzpitalnaKadra.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OgraniczeniaUprawnienController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OgraniczeniaUprawnienController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("osoba/{osobaId}")]
        public ActionResult<IEnumerable<OgraniczeniaUprawnien>> GetByOsobaId(int osobaId)
        {
            var ograniczenia = _context.OgraniczeniaUprawnien
                .Where(o => o.OsobaId == osobaId)
                .ToList();

            return Ok(ograniczenia);
        }
    }
}
