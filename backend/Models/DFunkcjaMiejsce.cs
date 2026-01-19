using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SzpitalnaKadra.Models
{
    [Table("d_funkcja_miejsce")]
    public class DFunkcjaMiejsce
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("kod")]
        public string Kod { get; set; } = string.Empty;

        [Column("nazwa")]
        public string Nazwa { get; set; } = string.Empty;
    }
}
