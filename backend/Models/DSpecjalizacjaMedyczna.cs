using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SzpitalnaKadra.Models
{
    [Table("d_specjalizacja_medyczna")]
    public class DSpecjalizacjaMedyczna
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("nazwa")]
        public string? Nazwa { get; set; }

        [Column("params")]
        public string? Params { get; set; }

        [Column("jparams")]
        public string? Jparams { get; set; }
    }
}
