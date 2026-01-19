using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SzpitalnaKadra.Models
{
    [Table("zatrudnienie")]
    public class Zatrudnienie
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("osoba_id")]
        public int OsobaId { get; set; }

        [Column("zatrudnienie_deklaracja")]
        public string? ZatrudnienieDeklaracja { get; set; }

        [Column("zatrudniony_od", TypeName = "date")]
        public DateTime? ZatrudnionyOd { get; set; }

        [Column("zatrudniony_do", TypeName = "date")]
        public DateTime? ZatrudnionyDo { get; set; }

        [Column("srednioczasowy_czas_pracy")]
        public string? SrednioczasowyCzasPracy { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
