using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SzpitalnaKadra.Models
{
    [Table("zawody_specjalnosci")]
    public class ZawodySpecjalnosci
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

        [Column("stopien_specjalizacji")]
        [StringLength(255)]
        public string StopienSpecjalizacji { get; set; }

        [Column("data_otwarcia_specjalizacji")]
        public DateTime? DataOtwarciaSpecjalizacji { get; set; }

        [Column("data_uzyskania_specjalizacji")]
        public DateTime? DataUzyskaniaSpecjalizacji { get; set; }

        [Column("dyplom")]
        [StringLength(255)]
        public string Dyplom { get; set; }
    }
}
