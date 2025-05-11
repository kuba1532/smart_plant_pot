using Microsoft.EntityFrameworkCore;
using DeviceServer.Models;

namespace DeviceServer.Data
{
    public class ApplicationDbContext : DbContext
    {
        public DbSet<DeviceReading> DeviceReadings { get; set; }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Mapping the class to the table in snake_case
            modelBuilder.Entity<DeviceReading>()
                .ToTable("device_readings");

            // Mapping properties to columns in snake_case
            modelBuilder.Entity<DeviceReading>()
                .Property(d => d.DeviceId)
                .HasColumnName("device_id");

            modelBuilder.Entity<DeviceReading>()
                .Property(d => d.Humidity)
                .HasColumnName("humidity");

            modelBuilder.Entity<DeviceReading>()
                .Property(d => d.LightIntensity)
                .HasColumnName("light_intensity");

            modelBuilder.Entity<DeviceReading>()
                .Property(d => d.Temperature)
                .HasColumnName("temperature");

            modelBuilder.Entity<DeviceReading>()
                .Property(d => d.Timestamp)
                .HasColumnName("time");

            // Define primary key (Composite Key)
            modelBuilder.Entity<DeviceReading>()
                .HasKey(d => new { d.Timestamp, d.DeviceId });
        }
    }
}