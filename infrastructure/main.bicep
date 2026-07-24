targetScope = 'resourceGroup'

@description('Short environment name used in Azure resource names.')
@allowed([
  'dev'
  'test'
  'prod'
])
param environment string

@description('Azure region for every regional resource.')
param location string = resourceGroup().location

@description('Globally unique suffix for globally named resources. Use lowercase letters and numbers only.')
@minLength(4)
@maxLength(12)
param resourceSuffix string = take(uniqueString(subscription().id, resourceGroup().id), 12)

@description('Linux App Service SKU. F1 is selected for this private, single-user workload.')
param appServiceSkuName string = 'F1'

@description('Linux App Service SKU tier.')
param appServiceSkuTier string = 'Free'

@description('The supported Node.js Linux runtime configured on the App Service web app.')
param linuxFxVersion string

var projectName = 'tjabane'
var namePrefix = '${projectName}-${environment}'
var appServicePlanName = '${namePrefix}-plan'
var webAppName = '${namePrefix}-api-${resourceSuffix}'
var keyVaultName = '${projectName}${environment}kv${resourceSuffix}'
var cosmosAccountName = '${projectName}-${environment}-cosmos-${resourceSuffix}'
var logAnalyticsName = '${namePrefix}-logs'
var applicationInsightsName = '${namePrefix}-ai'
var keyVaultSecretsUserRoleDefinitionId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
var cosmosDataContributorRoleDefinitionId = '00000000-0000-0000-0000-000000000002'

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    retentionInDays: 30
    sku: {
      name: 'PerGB2018'
    }
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: applicationInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableRbacAuthorization: true
    ...(environment == 'prod' ? {
      enablePurgeProtection: true
    } : {})
    enableSoftDelete: true
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
  }
}

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: cosmosAccountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    disableLocalAuth: true
    publicNetworkAccess: 'Enabled'
  }
}

resource appServicePlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: appServiceSkuName
    tier: appServiceSkuTier
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2024-04-01' = {
  name: webAppName
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    siteConfig: {
      linuxFxVersion: linuxFxVersion
      alwaysOn: false
      healthCheckPath: '/health'
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
    }
  }
}

resource webAppSettings 'Microsoft.Web/sites/config@2024-04-01' = {
  parent: webApp
  name: 'appsettings'
  properties: {
    APPLICATIONINSIGHTS_CONNECTION_STRING: applicationInsights.properties.ConnectionString
    APPLICATIONINSIGHTS_ROLE_NAME: '${projectName}-api'
    NODE_ENV: environment
    WEBSITE_HEALTHCHECK_MAXPINGFAILURES: '3'
  }
}

resource keyVaultSecretsUserAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, webApp.id, keyVaultSecretsUserRoleDefinitionId)
  scope: keyVault
  properties: {
    roleDefinitionId: keyVaultSecretsUserRoleDefinitionId
    principalId: webApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource cosmosDataContributorAssignment 'Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments@2024-05-15' = {
  parent: cosmosAccount
  name: guid(cosmosAccount.id, webApp.id, cosmosDataContributorRoleDefinitionId)
  properties: {
    roleDefinitionId: '${cosmosAccount.id}/sqlRoleDefinitions/${cosmosDataContributorRoleDefinitionId}'
    principalId: webApp.identity.principalId
    scope: cosmosAccount.id
  }
}

output webAppName string = webApp.name
output webAppDefaultHostName string = webApp.properties.defaultHostName
output keyVaultUri string = keyVault.properties.vaultUri
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
