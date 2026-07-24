targetScope = 'subscription'

@description('The Azure region for the resource group and regional resources.')
param location string

@description('The name of the resource group to create or update.')
param resourceGroupName string

@description('Short environment name passed to the resource-group deployment.')
@allowed([
  'dev'
  'test'
  'prod'
])
param environment string

@description('Globally unique suffix for globally named resources. Use lowercase letters and numbers only.')
@minLength(4)
@maxLength(12)
param resourceSuffix string = take(uniqueString(subscription().id, resourceGroupName), 12)

@description('Linux App Service SKU.')
param appServiceSkuName string = 'F1'

@description('Linux App Service SKU tier.')
param appServiceSkuTier string = 'Free'

@description('The supported Node.js Linux runtime configured on the App Service web app.')
param linuxFxVersion string

resource resourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
}

module infrastructure 'main.bicep' = {
  name: 'infrastructure'
  scope: resourceGroup
  params: {
    environment: environment
    location: location
    resourceSuffix: resourceSuffix
    appServiceSkuName: appServiceSkuName
    appServiceSkuTier: appServiceSkuTier
    linuxFxVersion: linuxFxVersion
  }
}

output webAppName string = infrastructure.outputs.webAppName
output webAppDefaultHostName string = infrastructure.outputs.webAppDefaultHostName
output keyVaultUri string = infrastructure.outputs.keyVaultUri
