using System;
using System.Text.Json;
using System.Threading.Tasks;
using DeviceServer.Data;
using DeviceServer.Models;
using DeviceServer.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DeviceServer.Services.Implementations.TopicHandlers
{
    public class DeviceReadingsHandler : ITopicHandler
    {
        private readonly IDbContextFactory<ApplicationDbContext> _dbContextFactory;
        
        public DeviceReadingsHandler(IDbContextFactory<ApplicationDbContext> dbContextFactory)
        {
            _dbContextFactory = dbContextFactory;
            Console.WriteLine("I was autodeployed!!!!!!!!!!!!S");
        }

        public async Task HandleAsync(string payload)
        {
            try
            {
                var reading = JsonSerializer.Deserialize<DeviceReading>(payload);
                if (reading is not null)
                {
                    using (var dbContext = await _dbContextFactory.CreateDbContextAsync())
                    {
                        await dbContext.DeviceReadings.AddAsync(reading);
                        await dbContext.SaveChangesAsync();
                        Console.WriteLine("[Readings] Stored in DB");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Error] Failed to handle message: {ex.Message}");
            }
        }

        public bool CanHandle(string topic)
        {
            return topic.StartsWith("device/") && topic.Contains("/readings/sendReading");
        }
    }
}