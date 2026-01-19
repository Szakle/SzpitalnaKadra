namespace SzpitalnaKadra.Models
{
    public class LoginRequest
    {
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
        public string? TotpCode { get; set; }
    }
}
