using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SzpitalnaKadra.Models
{
    [Table("d_zawod_specjalnosc")]
    public class DZawodSpecjalnosc
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("kod")]
        public string Kod { get; set; } = string.Empty;

        [Column("nazwa")]
        public string Nazwa { get; set; } = string.Empty;
    }
}
