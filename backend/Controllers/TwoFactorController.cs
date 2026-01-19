using Microsoft.AspNetCore.Mvc;
using SzpitalnaKadra.Data;
using SzpitalnaKadra.Models;
using OtpNet;
using System.Text;

namespace SzpitalnaKadra.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TwoFactorController : ControllerBase
    {
        private readonly AppDbContext _context;
        private const string Issuer = "SzpitalnaKadra";

        public TwoFactorController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Generuje sekret TOTP i zwraca dane do wyświetlenia QR kodu
        /// </summary>
        [HttpPost("setup/{userId}")]
        public IActionResult Setup(int userId)
        {
            var user = _context.DbUsers.FirstOrDefault(u => u.Id == userId);
            if (user == null)
                return NotFound("Użytkownik nie znaleziony.");

            if (user.TotpEnabled)
                return BadRequest("2FA jest już włączone dla tego użytkownika.");

            // Generuj losowy 20-bajtowy sekret
            var secretKey = KeyGeneration.GenerateRandomKey(20);
            var base32Secret = Base32Encoding.ToString(secretKey);

            // Zapisz sekret (jeszcze nie włączamy 2FA - czekamy na weryfikację)
            user.TotpSecret = base32Secret;
            _context.SaveChanges();

            // Generuj URI do QR kodu (standard otpauth://)
            var otpauthUri = $"otpauth://totp/{Issuer}:{user.Usename}?secret={base32Secret}&issuer={Issuer}&algorithm=SHA1&digits=6&period=30";

            return Ok(new
            {
                Secret = base32Secret,
                QrCodeUri = otpauthUri,
                ManualEntryKey = FormatSecretForManualEntry(base32Secret),
                Message = "Zeskanuj QR kod w aplikacji Microsoft Authenticator lub Google Authenticator, a następnie potwierdź kodem."
            });
        }

        /// <summary>
        /// Weryfikuje kod TOTP i włącza 2FA dla użytkownika
        /// </summary>
        [HttpPost("verify/{userId}")]
        public IActionResult Verify(int userId, [FromBody] TotpVerifyRequest request)
        {
            var user = _context.DbUsers.FirstOrDefault(u => u.Id == userId);
            if (user == null)
                return NotFound("Użytkownik nie znaleziony.");

            if (string.IsNullOrEmpty(user.TotpSecret))
                return BadRequest("Najpierw wygeneruj sekret przez /setup.");

            if (user.TotpEnabled)
                return BadRequest("2FA jest już włączone.");

            // Weryfikuj kod
            if (!VerifyTotpCode(user.TotpSecret, request.Code))
                return Unauthorized("Nieprawidłowy kod. Spróbuj ponownie.");

            // Włącz 2FA
            user.TotpEnabled = true;
            _context.SaveChanges();

            return Ok(new { Message = "2FA zostało pomyślnie włączone!" });
        }

        /// <summary>
        /// Wyłącza 2FA dla użytkownika (wymaga aktualnego kodu)
        /// </summary>
        [HttpPost("disable/{userId}")]
        public IActionResult Disable(int userId, [FromBody] TotpVerifyRequest request)
        {
            var user = _context.DbUsers.FirstOrDefault(u => u.Id == userId);
            if (user == null)
                return NotFound("Użytkownik nie znaleziony.");

            if (!user.TotpEnabled)
                return BadRequest("2FA nie jest włączone.");

            // Weryfikuj kod przed wyłączeniem
            if (!VerifyTotpCode(user.TotpSecret!, request.Code))
                return Unauthorized("Nieprawidłowy kod.");

            // Wyłącz 2FA
            user.TotpEnabled = false;
            user.TotpSecret = null;
            _context.SaveChanges();

            return Ok(new { Message = "2FA zostało wyłączone." });
        }

        /// <summary>
        /// Sprawdza status 2FA dla użytkownika
        /// </summary>
        [HttpGet("status/{userId}")]
        public IActionResult GetStatus(int userId)
        {
            var user = _context.DbUsers.FirstOrDefault(u => u.Id == userId);
            if (user == null)
                return NotFound("Użytkownik nie znaleziony.");

            return Ok(new
            {
                TotpEnabled = user.TotpEnabled,
                HasSecret = !string.IsNullOrEmpty(user.TotpSecret)
            });
        }

        /// <summary>
        /// Weryfikuje kod TOTP (używane przez LoginController)
        /// </summary>
        public static bool VerifyTotpCode(string base32Secret, string code)
        {
            if (string.IsNullOrEmpty(base32Secret) || string.IsNullOrEmpty(code))
                return false;

            try
            {
                var secretBytes = Base32Encoding.ToBytes(base32Secret);
                var totp = new Totp(secretBytes);
                
                // Weryfikuj z tolerancją ±1 okno czasowe (30 sekund przed i po)
                return totp.VerifyTotp(code, out _, new VerificationWindow(previous: 1, future: 1));
            }
            catch
            {
                return false;
            }
        }

        private static string FormatSecretForManualEntry(string secret)
        {
            // Formatuj sekret w grupy po 4 znaki dla łatwiejszego ręcznego wpisywania
            var sb = new StringBuilder();
            for (int i = 0; i < secret.Length; i += 4)
            {
                if (sb.Length > 0) sb.Append(' ');
                sb.Append(secret.Substring(i, Math.Min(4, secret.Length - i)));
            }
            return sb.ToString();
        }
    }

    public class TotpVerifyRequest
    {
        public string Code { get; set; } = string.Empty;
    }
}
