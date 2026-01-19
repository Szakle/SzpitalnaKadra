using Microsoft.AspNetCore.Mvc;
using SzpitalnaKadra.Data;
using SzpitalnaKadra.Models;
using SzpitalnaKadra.Helpers;
using System.Text.Json;

namespace SzpitalnaKadra.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DbUserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DbUserController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            var users = _context.DbUsers.ToList();
            var result = users.Select(u => new {
                u.Id,
                u.Usename,
                Role = u.Role,
                u.TotpEnabled,
                u.LastActivity
            });
            return Ok(result);
        }

        [HttpPost]
        public IActionResult Add(DbUser user)
        {
            // Wymuszenie UTC na DateTime – wymagane przez PostgreSQL
            user.LastPassChange = DateTime.SpecifyKind(user.LastPassChange, DateTimeKind.Utc);
            user.LastActivity = DateTime.SpecifyKind(user.LastActivity, DateTimeKind.Utc);

            _context.DbUsers.Add(user);
            _context.SaveChanges();
            return Ok(user);
        }

        public class CreateUserRequest
        {
            public string Username { get; set; } = "";
            public string Password { get; set; } = "";
            public string Role { get; set; } = "reader"; // reader lub writer
        }

        [HttpPost("create")]
        public IActionResult CreateUser([FromBody] CreateUserRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest("Nazwa użytkownika i hasło są wymagane.");
            }

            // Sprawdź czy użytkownik już istnieje
            var existingUser = _context.DbUsers.FirstOrDefault(u => u.Usename == request.Username);
            if (existingUser != null)
            {
                return BadRequest("Użytkownik o takiej nazwie już istnieje.");
            }

            // Utwórz nowego użytkownika
            var user = new DbUser
            {
                OsobaId = null, // Brak powiązania z osobą
                Usename = request.Username,
                Password = MD5PasswordHasher<DbUser>.HashPasswordWithUsername(request.Password, request.Username),
                FirstTimeLogin = true,
                LastPassChange = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                LastActivity = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                LastActivityApp = "SzpitalnaKadra",
                TotpEnabled = false,
                Params = JsonDocument.Parse($"{{\"rola\": \"{request.Role}\"}}")
            };

            _context.DbUsers.Add(user);
            _context.SaveChanges();

            return Ok(new { message = "Użytkownik został utworzony.", userId = user.Id });
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteUser(int id)
        {
            var user = _context.DbUsers.Find(id);
            if (user == null)
            {
                return NotFound("Użytkownik nie został znaleziony.");
            }

            _context.DbUsers.Remove(user);
            _context.SaveChanges();

            return Ok(new { message = "Użytkownik został usunięty." });
        }

        [HttpPut("{id}/password")]
        public IActionResult ChangePassword(int id, [FromBody] ChangePasswordRequest request)
        {
            var user = _context.DbUsers.Find(id);
            if (user == null)
            {
                return NotFound("Użytkownik nie został znaleziony.");
            }

            if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 4)
            {
                return BadRequest("Hasło musi mieć co najmniej 4 znaki.");
            }

            // Hash: MD5(password + username)
            user.Password = MD5PasswordHasher<DbUser>.HashPasswordWithUsername(request.NewPassword, user.Usename);
            user.LastPassChange = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            user.FirstTimeLogin = true; // Opcjonalnie: wymuszenie zmiany przy pierwszym logowaniu

            _context.SaveChanges();

            return Ok(new { message = "Hasło zostało zmienione." });
        }

        public class ChangePasswordRequest
        {
            public string NewPassword { get; set; } = string.Empty;
        }
    }
}
