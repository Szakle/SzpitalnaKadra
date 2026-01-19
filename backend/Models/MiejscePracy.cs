using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SzpitalnaKadra.Models
{
    [Table("miejsca_pracy")]
    public class MiejscePracy
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("osoba_id")]
        public int OsobaId { get; set; }

        [Column("kod_miejsca_udzielania_swiadczen")]
        public string? KodMiejscaUdzielaniaSwiadczen { get; set; }

        [Column("nazwa_miejsca_udzielania_swiadczen")]
        public string? NazwaMiejscaUdzielaniaSwiadczen { get; set; }

        [Column("kod_specjalnosci")]
        public string? KodSpecjalnosci { get; set; }

        [Column("nazwa_specjalnosci")]
        public string? NazwaSpecjalnosci { get; set; }

        [Column("zawod_specjalnosc")]
        public string? ZawodSpecjalnosc { get; set; }

        [Column("kod_funkcji")]
        public string? KodFunkcji { get; set; }

        [Column("nazwa_funkcji")]
        public string? NazwaFunkcji { get; set; }

        [Column("rodzaj_zatrudnienia")]
        public string? RodzajZatrudnienia { get; set; }

        [Column("bezterminowo")]
        public bool Bezterminowo { get; set; }

        [Column("praca_od", TypeName = "date")]
        public DateTime? PracaOd { get; set; }

        [Column("praca_do", TypeName = "date")]
        public DateTime? PracaDo { get; set; }

        [Column("typ_harmonogramu")]
        public string? TypHarmonogramu { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
