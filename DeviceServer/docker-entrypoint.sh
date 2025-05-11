#!/bin/bash
set -e

# Check if certificate exists, if not generate one
if [ ! -f /app/certs/certificate.pfx ]; then
    echo "No certificate found, generating self-signed certificate..."
    
    # Generate self-signed certificate
    openssl req -x509 -newkey rsa:4096 -keyout /app/certs/key.pem -out /app/certs/cert.pem -days 365 -nodes -subj "/CN=device-server"
    
    # Convert to PFX format that ASP.NET Core can use
    openssl pkcs12 -export -out /app/certs/certificate.pfx -inkey /app/certs/key.pem -in /app/certs/cert.pem -passout pass:
    
    echo "Self-signed certificate generated successfully"
fi

# Configure Kestrel to use the certificate
export ASPNETCORE_Kestrel__Certificates__Default__Path=/app/certs/certificate.pfx
export ASPNETCORE_Kestrel__Certificates__Default__Password=''

# Start the application
exec dotnet DeviceServer.dll