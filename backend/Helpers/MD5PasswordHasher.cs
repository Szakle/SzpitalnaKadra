using Microsoft.AspNetCore.Identity;
using System.Security.Cryptography;
using System.Text;

namespace SzpitalnaKadra.Helpers
{
    public class MD5PasswordHasher<TUser> : IPasswordHasher<TUser> where TUser : class
    {
        public string HashPassword(TUser user, string password)
        {
            var username = user?.GetType().GetProperty("Usename")?.GetValue(user)?.ToString() ?? "";
            return HashPasswordWithUsername(password, username);
        }

        public PasswordVerificationResult VerifyHashedPassword(TUser user, string hashedPassword, string providedPassword)
        {
            return HashPassword(user, providedPassword) == hashedPassword
                ? PasswordVerificationResult.Success
                : PasswordVerificationResult.Failed;
        }

        // Statyczna metoda do hashowania hasła z nazwą użytkownika
        public static string HashPasswordWithUsername(string password, string username)
        {
            using var md5 = MD5.Create();
            var inputBytes = Encoding.UTF8.GetBytes(password + username);
            var hashBytes = md5.ComputeHash(inputBytes);
            return "md5" + BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
        }
    }
}
