using DeviceServer.Data;
using DeviceServer.Settings;
using DeviceServer.Services.Interfaces;
using DeviceServer.Services.Implementations;
using DeviceServer.Services.Implementations.TopicHandlers;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using MQTTnet;


var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContextFactory<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.CommandTimeout(180); // Timeout in seconds
    }));

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();     // Required for minimal APIs and Swagger
builder.Services.AddSwaggerGen();               // Registers Swagger services
//mqtt
builder.Services.Configure<MqttSettings>(builder.Configuration.GetSection("MqttSettings"));
builder.Services.AddSingleton<IMessageHandlerService, MqttMessageHandlerService>();
builder.Services.AddSingleton<IMqttClient>(provider =>
    new MqttClientFactory().CreateMqttClient());
builder.Services.AddSingleton<ITopicHandler, DeviceSettingsChangeHandler>();
builder.Services.AddSingleton<ITopicHandler, DeviceAuditLoggerHandler>();
builder.Services.AddSingleton<ITopicHandler, DeviceReadingsHandler>();
builder.Services.AddSingleton<IDeviceCommunicationService, MqttDeviceCommunicationService>();




// CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()  // Allows all origins (you can restrict this for security reasons)
            .AllowAnyMethod()  // Allows any HTTP method (GET, POST, etc.)
            .AllowAnyHeader(); // Allows any HTTP header
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();                           // Enables Swagger JSON endpoint
    app.UseSwaggerUI();                         // Enables Swagger UI
}

// Enable CORS middleware (ensure this is added before app.UseAuthorization)
app.UseCors("AllowAll");

//app.UseHttpsRedirection();

//app.UseAuthorization();

app.MapControllers();                            // Maps [ApiController] classes
app.Lifetime.ApplicationStarted.Register(() => 
{
    Console.WriteLine("Application fully started and listening for requests");
    Console.WriteLine($"ASPNETCORE_URLS: {Environment.GetEnvironmentVariable("ASPNETCORE_URLS")}");
    // Log other important configuration values
});

//mqtt
var mqttService = app.Services.GetRequiredService<IDeviceCommunicationService>();
await mqttService.StartAsync(); // 🟢 Start it here
await mqttService.SendMessageToCommonDebug("hi");

app.Run();