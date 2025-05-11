using System;
using System.Threading.Tasks;
using DeviceServer.Services.Interfaces;

namespace DeviceServer.Services.Implementations.TopicHandlers
{
    public class DeviceAuditLoggerHandler : ITopicHandler
    {
        public Task HandleAsync(string payload)
        {
            Console.WriteLine($"[Audit] Logging message: {payload}");
            // Additional logic for auditing, like writing to a database or file.
            return Task.CompletedTask;
        }

        public bool CanHandle(string topic)
        {
            return true; // This handler will log all topics
        }
    }
}