using System.Text.Json;
using DeviceServer.Models;
using DeviceServer.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DeviceServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        private readonly IDeviceCommunicationService _deviceCommunicationService;

        public SettingsController(IDeviceCommunicationService deviceCommunicationService)
        {
            _deviceCommunicationService = deviceCommunicationService;
        }

        [HttpPost("update-settings")]
        public async Task<IActionResult> ChangeSettings([FromBody] ChangeSettingsInput settings)
        {
            var requestHeaders = Request.Headers.ToString();
            var requestBody = await new StreamReader(Request.Body).ReadToEndAsync();

            Console.WriteLine("Headers: " + requestHeaders);
            Console.WriteLine("Body: " + requestBody);

            if (settings == null)
            {
                return BadRequest("Invalid settings data.");
            }

            // 🔽 Send MQTT message
            ChangeSettings outputSettings = settings;
            var mqttPayload = JsonSerializer.Serialize(outputSettings);

            // ✅ Send message via MQTT
            var topic = $"device/{settings.DeviceId}/settings/changeSettings";
            
            await _deviceCommunicationService.SendMessage(topic, mqttPayload);

            return Ok("Settings updated successfully for device " + settings.DeviceId);
        }
    }
}