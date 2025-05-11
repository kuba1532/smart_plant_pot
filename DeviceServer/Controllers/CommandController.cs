using System.Text.Json;
using DeviceServer.Models;
using DeviceServer.Services.Enums;
using DeviceServer.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DeviceServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommandController : ControllerBase
    {
        private readonly IDeviceCommunicationService _deviceCommunicationService;
        
        public CommandController(IDeviceCommunicationService deviceCommunicationService)
        {
            _deviceCommunicationService = deviceCommunicationService;
        }

            [HttpPost("send-command")]
            public IActionResult SendCommand([FromBody] SendCommandInput command)
            {
                var requestHeaders = Request.Headers.ToString();
                // Asynchronously read the request body
                var requestBody =  new StreamReader(Request.Body).ReadToEndAsync().GetAwaiter().GetResult();
    
                Console.WriteLine("Headers: " + requestHeaders);
                Console.WriteLine("Body: " + requestBody);
            
                // Check if the request body is null or the model is invalid
                if (command == null)
                {
                    return BadRequest("Invalid command data.");
                }
                
                SendCommand outputCommand = command;
                var mqttPayload = JsonSerializer.Serialize(outputCommand);
                
                var topic = $"device/{command.DeviceId}/command/sendCommand";
                _deviceCommunicationService.SendMessage(topic, mqttPayload);

                // Return a success response
                return Ok("Command sent successfully.");
            }
        }
}