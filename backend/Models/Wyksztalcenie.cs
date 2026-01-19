using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SzpitalnaKadra.Models
{
    [Table("wyksztalcenie")]
    public class Wyksztalcenie
    {
        [Key]
        [Column("id")]
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [Column("osoba_id")]
        [JsonPropertyName("osobaId")]
        public int OsobaId { get; set; }

        [Column("rodzaj_wyksztalcenia")]
        [StringLength(255)]
        [JsonPropertyName("rodzajWyksztalcenia")]
        public string? RodzajWyksztalcenia { get; set; }

        [Column("kierunek")]
        [StringLength(255)]
        [JsonPropertyName("kierunek")]
        public string? Kierunek { get; set; }

        [Column("uczelnia")]
        [StringLength(255)]
        [JsonPropertyName("uczelnia")]
        public string? Uczelnia { get; set; }

        [Column("data_ukonczenia")]
        [JsonPropertyName("dataUkonczenia")]
        public DateTime? DataUkonczenia { get; set; }

        [Column("dyplom")]
        [StringLength(255)]
        [JsonPropertyName("dyplom")]
        public string? Dyplom { get; set; }
    }
}
