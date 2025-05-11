using MQTTnet;
using Microsoft.Extensions.Options;
using System;
using System.Text;
using System.Threading.Tasks;
using DeviceServer;
using DeviceServer.Services.Enums;
using MQTTnet.Protocol;
using DeviceServer.Services.Interfaces;
using DeviceServer.Settings;

namespace DeviceServer.Services.Implementations;

public class MqttDeviceCommunicationService: IDeviceCommunicationService
{
    private readonly IMqttClient _mqttClient;
    private readonly MqttSettings _mqttSettings;
    private readonly IMessageHandlerService _messageHandler;

    public MqttDeviceCommunicationService(
        IMqttClient mqttClient,
        IOptions<MqttSettings> mqttSettings,
        IMessageHandlerService messageHandler)
    {
        _mqttClient = mqttClient;
        _mqttSettings = mqttSettings.Value;
        _messageHandler = messageHandler;
    }

    public async Task StartAsync()
    {
        
        var tlsOptions = new MqttClientTlsOptionsBuilder()
            .UseTls(true)
            .WithAllowUntrustedCertificates(true)
            .WithIgnoreCertificateChainErrors(true)
            .WithIgnoreCertificateRevocationErrors(true)
            .Build();
        
        var mqttOptions = new MqttClientOptionsBuilder()
            .WithTlsOptions(tlsOptions)
            .WithTcpServer(_mqttSettings.BrokerAddress, _mqttSettings.Port)
            .WithCredentials(_mqttSettings.Credentials.Username, _mqttSettings.Credentials.Password)
            .WithClientId(_mqttSettings.ClientId)
            .Build();

        await _mqttClient.ConnectAsync(mqttOptions);
        Console.WriteLine("Connected to MQTT broker.");

        // Subscribe to each topic listed in the configuration
        foreach (var topic in _mqttSettings.TopicsToSubscribe)
        {
            await _mqttClient.SubscribeAsync(topic);
            Console.WriteLine($"Subscribed to topic: {topic}");
        }

        // Listen for incoming messages
        _mqttClient.ApplicationMessageReceivedAsync += async e =>
        {
            var payload = Encoding.UTF8.GetString(e.ApplicationMessage.Payload);
            var topic = e.ApplicationMessage.Topic;

            Console.WriteLine($"Received raw message on topic: {topic}");

            await _messageHandler.HandleMessageAsync(topic, payload);
        };
    }

    public Task StopAsync() => _mqttClient.DisconnectAsync();

    public Task SendMessageToCommonDebug(string payload)
    {
        var message = new MqttApplicationMessageBuilder()
            .WithTopic("common/debug")
            .WithPayload(payload)
            .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.ExactlyOnce)
            .WithRetainFlag()
            .Build();
        return _mqttClient.PublishAsync(message);
    }
    
    public async Task SendMessage(string topic, string payload, QualityOfService qualityOfService = QualityOfService.AtLeastOnce, bool retain = false)
    {
        MqttQualityOfServiceLevel mqttQualityOfServiceLevel;
        switch (qualityOfService)
        {
            case QualityOfService.AtLeastOnce:
                mqttQualityOfServiceLevel = MqttQualityOfServiceLevel.AtLeastOnce;
                break;
            case QualityOfService.ExactlyOnce:
                mqttQualityOfServiceLevel = MqttQualityOfServiceLevel.ExactlyOnce;
                break;
            case QualityOfService.AtMostOnce:
                mqttQualityOfServiceLevel = MqttQualityOfServiceLevel.AtMostOnce;
                break;
            default:
                mqttQualityOfServiceLevel = MqttQualityOfServiceLevel.AtLeastOnce;
                break;
        }
        var message = new MqttApplicationMessageBuilder()
            .WithTopic(topic)
            .WithPayload(payload)
            .WithQualityOfServiceLevel(mqttQualityOfServiceLevel)
            .WithRetainFlag(retain)
            .Build();

        await SendMessageToCommonDebug($"Message sent on topic: {topic}");
        await _mqttClient.PublishAsync(message);
    }
}