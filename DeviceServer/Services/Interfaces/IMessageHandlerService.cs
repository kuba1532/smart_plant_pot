namespace DeviceServer.Services.Interfaces;

public interface IMessageHandlerService
{
    Task HandleMessageAsync(string topic, string payload);
}