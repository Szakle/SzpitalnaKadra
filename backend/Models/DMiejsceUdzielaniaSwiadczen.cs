using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SzpitalnaKadra.Models
{
    [Table("d_miejsce_udzielania_swiadczen")]
    public class DMiejsceUdzielaniaSwiadczen
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("kod")]
        public string Kod { get; set; } = string.Empty;

        [Column("nazwa")]
        public string Nazwa { get; set; } = string.Empty;

        [Column("adres")]
        public string? Adres { get; set; }
    }
}
