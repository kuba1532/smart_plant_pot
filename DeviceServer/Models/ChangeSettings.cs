namespace DeviceServer.Models;

public class ChangeSettings
{
    public double MaxHumidity { get; set; }
    public double MinHumidity { get; set; }
    public double MaxBrightness { get; set; }
    public double MinBrightness { get; set; }
    public string BrightPeriodStart { get; set; }
    public string BrightPeriodEnd { get; set; }
}