using DeviceServer.Services.Enums;
using MQTTnet.Protocol;

namespace DeviceServer.Services.Interfaces;

public interface IDeviceCommunicationService
{
    Task StartAsync();
    Task StopAsync();
    Task SendMessageToCommonDebug(string payload);
    Task SendMessage(string topic, string payload, QualityOfService qualityOfService = QualityOfService.AtLeastOnce, bool retain = false);
}