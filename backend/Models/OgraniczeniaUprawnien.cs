using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SzpitalnaKadra.Models
{
    [Table("ograniczenia_uprawnien")]
    public class OgraniczeniaUprawnien
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("osoba_id")]
        public int OsobaId { get; set; }

        [Column("typ_ograniczenia")]
        [StringLength(255)]
        public string TypOgraniczenia { get; set; }

        [Column("opis")]
        public string Opis { get; set; }

        [Column("data_od")]
        public DateTime? DataOd { get; set; }

        [Column("data_do")]
        public DateTime? DataDo { get; set; }
    }
}
