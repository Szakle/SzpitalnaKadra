using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SzpitalnaKadra.Models
{
    [Table("d_rodzaj_wyksztalcenia")]
    public class DRodzajWyksztalcenia
    {
        [Key]
        [Column("id")]
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [Column("kod")]
        [StringLength(4)]
        [JsonPropertyName("kod")]
        public string Kod { get; set; } = string.Empty;

        [Column("nazwa")]
        [StringLength(255)]
        [JsonPropertyName("nazwa")]
        public string Nazwa { get; set; } = string.Empty;

        [Column("aktywny")]
        [JsonPropertyName("aktywny")]
        public bool Aktywny { get; set; } = true;
    }
}
