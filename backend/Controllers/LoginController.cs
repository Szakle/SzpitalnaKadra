using Microsoft.AspNetCore.Mvc;
using SzpitalnaKadra.Data;
using SzpitalnaKadra.Models;
using SzpitalnaKadra.Helpers;
using System.Security.Cryptography;
using System.Text;

namespace SzpitalnaKadra.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LoginController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LoginController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            var username = request.Username;
            var password = request.Password;

            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                return BadRequest("Nieprawidłowe dane logowania.");

            string hashed = "md5" + GetMd5Hash(password + username);

            var user = _context.DbUsers
                .FirstOrDefault(u => u.Usename == username && u.Password == hashed);

            if (user == null)
                return Unauthorized("Nieprawidłowy login lub hasło.");

            // Sprawdź czy użytkownik ma włączone 2FA
            if (user.TotpEnabled)
            {
                // Jeśli nie podano kodu TOTP, zwróć informację że jest wymagany
                if (string.IsNullOrWhiteSpace(request.TotpCode))
                {
                    return Ok(new 
                    { 
                        RequiresTwoFactor = true, 
                        Message = "Wymagany kod z aplikacji uwierzytelniającej.",
                        UserId = user.Id
                    });
                }

                // Weryfikuj kod TOTP
                if (!TwoFactorController.VerifyTotpCode(user.TotpSecret!, request.TotpCode))
                {
                    return Unauthorized("Nieprawidłowy kod uwierzytelniający.");
                }
            }

            // Aktualizuj ostatnią aktywność
            user.LastActivity = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            user.LastActivityApp = "SzpitalnaKadra";
            _context.SaveChanges();

            return Ok(new { user.Id, user.Usename, user.OsobaId, TwoFactorEnabled = user.TotpEnabled, user.Role });
        }

        private static string GetMd5Hash(string input)
        {
            using var md5 = MD5.Create();
            var inputBytes = Encoding.UTF8.GetBytes(input);
            var hashBytes = md5.ComputeHash(inputBytes);

            var sb = new StringBuilder();
            foreach (var b in hashBytes)
                sb.Append(b.ToString("x2"));

            return sb.ToString();
        }
    }
}
