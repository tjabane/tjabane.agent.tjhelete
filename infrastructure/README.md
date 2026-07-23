# Azure infrastructure

This directory contains Bicep templates for the Azure MVP infrastructure only.
It does not contain a GitHub Actions workflow, application deployment package,
or third-party secret values.

## What is provisioned

- Resource group (when deploying `subscription.bicep`)
- Linux App Service plan and Node.js web app
- System-assigned managed identity for the web app
- Azure Key Vault with RBAC authorization
- Azure Cosmos DB for NoSQL with local-key authentication disabled
- Role assignments allowing the web app to read Key Vault secrets and access
  Cosmos DB data
- Log Analytics workspace and workspace-based Application Insights
- App Service settings for Application Insights, health checks, and WebJobs

The web app has HTTPS-only access, Always On, HTTP/2, a `/health` health-check
path, and FTP deployment disabled. The selected App Service SKU must support
Always On; the default `P0v3` is intended as a production-capable baseline.

## Parameters

Deploy `subscription.bicep` at subscription scope. It creates the target
resource group and deploys `main.bicep` to it. `parameters/dev.bicepparam` is
an example only: replace `resourceSuffix` with a globally unique lowercase
value before a deployment. Do not use the placeholder as-is.

`linuxFxVersion` must be a Node.js runtime supported by App Service in the
target region. Keep it aligned with the repository's Node engine requirement.

## Secrets and application deployment

The templates intentionally create no third-party secret values. After the
Key Vault is provisioned, an authorised operator adds the Twilio, Investec,
and LLM provider secrets. The deployment workflow then adds Key Vault-backed
App Service settings in the form:

```text
@Microsoft.KeyVault(SecretUri=https://<vault>.vault.azure.net/secrets/<name>)
```

The system-assigned identity already has the `Key Vault Secrets User` role.
Use slot settings for all secret app settings if deployment slots are enabled.

Scheduled reports remain triggered WebJobs. This infrastructure enables the
App Service requirements for them (`Always On` and the Kudu agent); the WebJob
script/archive is application content and will be deployed separately by the
future GitHub Actions workflow.

## Deployment example

After authentication and parameter review, the deployment command is:

```powershell
az deployment sub create `
  --location southafricanorth `
  --template-file infrastructure/subscription.bicep `
  --parameters infrastructure/parameters/dev.bicepparam
```

Run `az deployment sub what-if` with the same inputs before applying a new or
production environment.
