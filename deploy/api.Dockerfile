FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY CloudServiceStore.sln ./
COPY Directory.Build.props ./
COPY dotnet-tools.json ./
COPY src/CloudServiceStore.Domain/CloudServiceStore.Domain.csproj src/CloudServiceStore.Domain/
COPY src/CloudServiceStore.Application/CloudServiceStore.Application.csproj src/CloudServiceStore.Application/
COPY src/CloudServiceStore.Infrastructure/CloudServiceStore.Infrastructure.csproj src/CloudServiceStore.Infrastructure/
COPY src/CloudServiceStore.WebApi/CloudServiceStore.WebApi.csproj src/CloudServiceStore.WebApi/
RUN dotnet restore src/CloudServiceStore.WebApi/CloudServiceStore.WebApi.csproj

COPY src/ src/
RUN dotnet publish src/CloudServiceStore.WebApi/CloudServiceStore.WebApi.csproj --configuration Release --output /app/publish --no-restore

FROM build AS migrator
RUN dotnet tool restore
ENTRYPOINT ["dotnet", "tool", "run", "dotnet-ef"]

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CloudServiceStore.WebApi.dll"]
