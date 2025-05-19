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

# Install OpenSSL for certificate generation
RUN apt-get update && apt-get install -y openssl && apt-get clean

# Create directory for certificates
RUN mkdir -p /app/certs

# Configure ports
ENV HTTP_PORT=8080
ENV HTTPS_PORT=8443
EXPOSE ${HTTP_PORT} ${HTTPS_PORT}

# Configure the application to listen on both HTTP and HTTPS ports
ENV ASPNETCORE_URLS=http://+:${HTTP_PORT};https://+:${HTTPS_PORT}

# Set up entry point script to generate certificate if needed and start the app
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]