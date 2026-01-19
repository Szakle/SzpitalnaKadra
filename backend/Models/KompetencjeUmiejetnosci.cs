using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SzpitalnaKadra.Models
{
    [Table("kompetencje_umiejetnosci")]
    public class KompetencjeUmiejetnosci
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("osoba_id")]
        public int OsobaId { get; set; }

        [Column("kod")]
        [StringLength(50)]
        public string Kod { get; set; }

        [Column("nazwa")]
        [StringLength(255)]
        public string Nazwa { get; set; }

        [Column("poziom")]
        [StringLength(50)]
        public string Poziom { get; set; }

        [Column("zaswiadczenie")]
        [StringLength(255)]
        public string Zaswiadczenie { get; set; }
    }
}
