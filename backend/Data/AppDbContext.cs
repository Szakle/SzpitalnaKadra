using Microsoft.EntityFrameworkCore;
using SzpitalnaKadra.Models;

namespace SzpitalnaKadra.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Osoba> Osoby { get; set; }
        public DbSet<DbUser> DbUsers { get; set; }
        public DbSet<Zatrudnienie> Zatrudnienia { get; set; }
        public DbSet<Wyksztalcenie> Wyksztalcenia { get; set; }
        public DbSet<DRodzajWyksztalcenia> DRodzajeWyksztalcenia { get; set; }
        public DbSet<UprawnieniZawodowe> UprawnieniZawodowe { get; set; }
        public DbSet<DRodzajUprawnieniazawodowego> DRodzajeUprawnienZawodowych { get; set; }
        public DbSet<DTypPersonelu> DTypyPersonelu { get; set; }
        public DbSet<DSpecjalizacjaMedyczna> DSpecjalizacjeMedyczne { get; set; }
        public DbSet<OgraniczeniaUprawnien> OgraniczeniaUprawnien { get; set; }
        public DbSet<ZawodySpecjalnosci> ZawodySpecjalnosci { get; set; }
        public DbSet<KompetencjeUmiejetnosci> KompetencjeUmiejetnosci { get; set; }
        public DbSet<DKompetencjeUmiejetnosci> DKompetencjeUmiejetnosci { get; set; }
        public DbSet<DOrganRejestrujacy> DOrganyRejestrujace { get; set; }
        public DbSet<DZawodSpecjalnosc> DZawodySpecjalnosci { get; set; }
        public DbSet<DoswiadczenieZawodowe> DoswiadczenieZawodowe { get; set; }
        public DbSet<DDoswiadczenieZawodowe> DDoswiadczenieZawodowe { get; set; }
        public DbSet<MiejscePracy> MiejscaPracy { get; set; }
        public DbSet<DFunkcjaMiejsce> DFunkcjeMiejsce { get; set; }
        public DbSet<DMiejsceUdzielaniaSwiadczen> DMiejscaUdzielaniaSwiadczen { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }
    }
}
