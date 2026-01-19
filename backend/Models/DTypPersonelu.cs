using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SzpitalnaKadra.Models
{
    [Table("d_typ_personelu")]
    public class DTypPersonelu
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("nazwa")]
        public string? Nazwa { get; set; }

        [Column("kod")]
        public string? Kod { get; set; }

        [Column("kod_ewp")]
        public string? KodEwp { get; set; }

        [Column("kod_zm")]
        public string? KodZm { get; set; }

        [Column("kod_hl7")]
        public string? KodHl7 { get; set; }

        [Column("kod_pwz")]
        public string? KodPwz { get; set; }
    }
}
