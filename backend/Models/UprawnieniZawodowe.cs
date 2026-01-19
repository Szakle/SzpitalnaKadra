using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SzpitalnaKadra.Models
{
    [Table("uprawnienia_zawodowe")]
    public class UprawnieniZawodowe
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("osoba_id")]
        public int OsobaId { get; set; }

        [Column("rodzaj")]
        [StringLength(255)]
        public string Rodzaj { get; set; }

        [Column("npwz_id_rizh")]
        [StringLength(255)]
        public string NpwzIdRizh { get; set; }

        [Column("organ_rejestrujacy")]
        [StringLength(255)]
        public string OrganRejestrujacy { get; set; }

        [Column("data_uzycia_uprawnienia")]
        public DateTime? DataUzyciaUprawnienia { get; set; }
    }
}
