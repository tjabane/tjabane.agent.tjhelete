using '../subscription.bicep'

param location = 'southafricanorth'
param resourceGroupName = 'tjabane-dev-rg'
param environment = 'dev'
param linuxFxVersion = 'NODE|24-lts'
param appServiceSkuName = 'F1'
param appServiceSkuTier = 'Free'
