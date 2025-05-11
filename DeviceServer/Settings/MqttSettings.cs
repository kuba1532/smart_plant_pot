namespace DeviceServer.Settings;

public class MqttSettings
{
    public string BrokerAddress { get; set; }
    public int Port { get; set; }
    public string ClientId { get; set; }
    public MqttCredentials Credentials { get; set; }
    public string[] TopicsToSubscribe { get; set; }
}

public class MqttCredentials
{
    public string Username { get; set; }
    public string Password { get; set; }
}