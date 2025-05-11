FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
# Copy csproj and restore dependencies
COPY *.csproj .
RUN dotnet restore
# Copy everything else and build
COPY . .
RUN dotnet publish -c Release -o /app

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .

# Create directory for certificates
RUN mkdir -p /app/certs

# Configure ports and environment variables
ENV HTTP_PORT=8080
ENV HTTPS_PORT=8443
EXPOSE ${HTTP_PORT} ${HTTPS_PORT}

# Configure the application to listen on the correct ports
ENV ASPNETCORE_URLS=http://+:${HTTP_PORT};https://+:${HTTPS_PORT}
ENV ASPNETCORE_Kestrel__Certificates__Default__Path=/app/certs/certificate.pfx
ENV ASPNETCORE_Kestrel__Certificates__Default__Password=''

ENTRYPOINT ["dotnet", "DeviceServer.dll"]