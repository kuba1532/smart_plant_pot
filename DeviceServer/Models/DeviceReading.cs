using System;

namespace DeviceServer.Models
{
    public class DeviceReading
    {
        public int DeviceId { get; set; }
        public float Humidity { get; set; }
        public float LightIntensity { get; set; }
        public float Temperature { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}