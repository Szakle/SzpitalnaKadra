using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SzpitalnaKadra.Models
{
    [Table("d_rodzaj_uprawnienia_zawodowego")]
    public class DRodzajUprawnieniazawodowego
    {
        [Key]
        [Column("id")]
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [Column("nazwa")]
        [StringLength(255)]
        [JsonPropertyName("nazwa")]
        public string Nazwa { get; set; } = string.Empty;

        [Column("rodzaj_rejestru")]
        [StringLength(10)]
        [JsonPropertyName("rodzajRejestru")]
        public string RodzajRejestru { get; set; } = string.Empty;

        [Column("aktywny")]
        [JsonPropertyName("aktywny")]
        public bool Aktywny { get; set; } = true;
    }
}
