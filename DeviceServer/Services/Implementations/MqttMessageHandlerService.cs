// Services/Implementations/MqttMessageHandlerService.cs
using System;
using System.Text.Json;
using System.Threading.Tasks;
using DeviceServer.Data;
using DeviceServer.Services.Interfaces;

namespace DeviceServer.Services.Implementations
{
    public class MqttMessageHandlerService : IMessageHandlerService
    {
        private readonly IEnumerable<ITopicHandler> _topicHandlers;

        public MqttMessageHandlerService(IEnumerable<ITopicHandler> topicHandlers)
        {
            _topicHandlers = topicHandlers;
        }
        
        private List<ITopicHandler> FindHandlerForTopic(string topic)
        {
            List<ITopicHandler> handlers = new List<ITopicHandler>();
            foreach (var handler in _topicHandlers)
            {
                if (handler.CanHandle(topic))
                {
                    handlers.Add(handler);
                }
            }
            return handlers; // No handler found for the topic
        }

        public async Task HandleMessageAsync(string topic, string payload)
        {
            Console.WriteLine($"[MqttHandler] Topic: {topic}");
            Console.WriteLine($"[MqttHandler] Payload: {payload}");
            
            // Find the handler that can process this topic
            var handlers = FindHandlerForTopic(topic);
            if (handlers.Any())
            {
                foreach (var handler in handlers)
                {
                    await handler.HandleAsync(payload);
                }
            }
            else
            {
                Console.WriteLine($"No handler found for topic: {topic}");
            }
        }
    }
}