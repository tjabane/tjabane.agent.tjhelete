using '../subscription.bicep'

param location = 'southafricanorth'
param resourceGroupName = 'tjabane-prod-rg'
param environment = 'prod'
param linuxFxVersion = 'NODE|24-lts'
param appServiceSkuName = 'F1'
param appServiceSkuTier = 'Free'
