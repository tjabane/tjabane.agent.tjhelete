using '../subscription.bicep'

param location = 'southafricanorth'
param resourceGroupName = 'tjabane-dev-rg'
param environment = 'dev'
param resourceSuffix = 'replacebeforedeploy'
param linuxFxVersion = 'NODE|24-lts'
param appServiceSkuName = 'P0v3'
param appServiceSkuTier = 'PremiumV3'
param maximumWorkerCount = 2
