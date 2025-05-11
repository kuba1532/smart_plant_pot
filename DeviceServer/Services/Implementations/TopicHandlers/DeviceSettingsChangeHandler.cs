using System;
using System.Threading.Tasks;
using DeviceServer.Data;
using DeviceServer.Services.Interfaces;

namespace DeviceServer.Services.Implementations.TopicHandlers
{
    public class DeviceSettingsChangeHandler : ITopicHandler
    {

        public Task HandleAsync(string payload)
        {
            Console.WriteLine($"Handling Device Settings Change: {payload}");
            // Additional logic to process the settings change.
            return Task.CompletedTask;
        }

        public bool CanHandle(string topic)
        {
            return topic.StartsWith("device/") && topic.Contains("/settings/changeSettings");
        }
    }
}