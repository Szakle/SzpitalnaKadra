using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SzpitalnaKadra.Models
{
    [Table("d_doswiadczenie_zawodowe")]
    public class DDoswiadczenieZawodowe
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("kod")]
        public string Kod { get; set; } = string.Empty;

        [Column("nazwa")]
        public string Nazwa { get; set; } = string.Empty;

        [Column("opis")]
        public string? Opis { get; set; }
    }
}
