namespace DeviceServer.Services.Interfaces
{
    public interface ITopicHandler
    {
        Task HandleAsync(string payload);
        bool CanHandle(string topic);
    }
}