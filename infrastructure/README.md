# Azure infrastructure

This directory contains Bicep templates for the Azure MVP infrastructure only.
It does not contain a GitHub Actions workflow, application deployment package,
or third-party secret values.

## What is provisioned

- Resource group (when deploying `subscription.bicep`)
- Linux App Service plan and Node.js web app
- System-assigned managed identity for the web app
- Azure Key Vault with RBAC authorization
- Serverless Azure Cosmos DB for NoSQL with `sessions` and `inboundMessages`
  containers and local-key authentication disabled
- Role assignments allowing the web app to read Key Vault secrets and access
  Cosmos DB data
- Log Analytics workspace and workspace-based Application Insights
- App Service settings for Application Insights, health checks, provider
  configuration, and Key Vault-backed secrets

The web app has HTTPS-only access, HTTP/2, a `/health` health-check path, and
FTP deployment disabled. The `F1` Free SKU is deliberately selected because
this is a private, single-user workload. It has no App Service compute charge,
but it also has no SLA, no Always On, no scale-out, a 60 CPU-minute daily
quota, 1 GB storage, and no custom domain support. The application therefore
uses the default `azurewebsites.net` HTTPS hostname and may cold-start after an
idle period.

## Environment SKU baseline

| Resource             | Development                                   | Production                                    |
| -------------------- | --------------------------------------------- | --------------------------------------------- |
| App Service plan     | `F1` / `Free`, one shared worker              | `F1` / `Free`, one shared worker              |
| App Service web app  | Included in the App Service plan              | Included in the App Service plan              |
| Scheduled functions  | Planned Flex Consumption (`FC1`)              | Planned Flex Consumption (`FC1`)              |
| Cosmos DB for NoSQL  | Serverless, usage-based RUs and storage       | Serverless, usage-based RUs and storage       |
| Key Vault            | `Standard`                                    | `Standard`                                    |
| Log Analytics        | `PerGB2018` pay-as-you-go; 30-day retention   | `PerGB2018` pay-as-you-go; 30-day retention   |
| Application Insights | Workspace-based; billed through Log Analytics | Workspace-based; billed through Log Analytics |

Resource groups, managed identities, and role assignments have no SKU. See
the [infrastructure design](../docs/spec/07_infrastructure-design.md) for the
component-to-resource mapping, reasons for each resource, stage-specific SKU
rationale, outstanding capacity decisions, single-user
[running-cost estimate](../docs/spec/07_infrastructure-design.md#running-cost-estimate),
pricing assumptions, and first-month review checklist.

Cosmos DB uses the `EnableServerless` account capability. It has no provisioned
RU/s minimum and is billed for consumed request units and storage. Serverless
does not use the Cosmos DB provisioned-throughput Free Tier. The `sessions` and
`inboundMessages` containers use `/id` partition keys. Inbound idempotency
records have a one-day default TTL. No throughput value is supplied because
the account is serverless.

## Parameters

Deploy `subscription.bicep` at subscription scope. It creates the target
resource group and deploys `main.bicep` to it. The development and production
profiles are `parameters/dev.bicepparam` and `parameters/prod.bicepparam`.
The templates derive a stable globally unique resource suffix from the
subscription ID and resource-group name, so operators do not need to maintain
or pass one manually. A caller may still override `resourceSuffix` when a
specific existing naming convention must be preserved.

`linuxFxVersion` must be a Node.js runtime supported by App Service in the
target region. Keep it aligned with the repository's Node engine requirement.

## Secrets and application deployment

The templates intentionally create no third-party secret values. After the
Key Vault is provisioned, an authorised operator must add these secrets:

- `twilio-auth-token`
- `twilio-allowed-whatsapp-sender`
- `app-internal-user-id`
- `openai-api-key`
- `investec-base-url`
- `investec-token-url`
- `investec-client-id`
- `investec-client-secret`
- `investec-api-key`

The web app consumes them through Key Vault-backed App Service settings in the
form:

```text
@Microsoft.KeyVault(SecretUri=https://<vault>.vault.azure.net/secrets/<name>)
```

The system-assigned identity already has the `Key Vault Secrets User` role.
Use slot settings for all secret app settings if deployment slots are enabled.

Scheduled reports cannot run reliably as App Service WebJobs on `F1`, because
the Free tier has no Always On. They will be implemented as timer-triggered
Azure Functions on Flex Consumption (`FC1`), with zero always-ready instances.
That resource and its application artifact are not provisioned yet. Flex
Consumption includes a monthly grant for on-demand executions and execution
time; the operator must still monitor usage and the associated storage account.

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

## GitHub Actions deployment

The workflow in `.github/workflows/deploy.yml` runs linting, tests, and the
TypeScript build before creating one immutable application artifact. Pull
requests to `main` run validation only. A push to `main` deploys to the
`development` GitHub environment. A `v*` tag deploys to the `production` GitHub
environment. Either environment can also be selected in a manual
`workflow_dispatch` run.

Create GitHub environments named `development` and `production`. Define these
environment variables in each environment:

| Variable                | Purpose                                       |
| ----------------------- | --------------------------------------------- |
| `AZURE_CLIENT_ID`       | Client ID of the environment's Azure identity |
| `AZURE_TENANT_ID`       | Microsoft Entra tenant ID                     |
| `AZURE_SUBSCRIPTION_ID` | Target Azure subscription ID                  |

Configure a federated identity credential for each GitHub environment rather
than storing an Azure client secret. Its subject is:

```text
repo:<owner>/<repository>:environment:<environment>
```

The deployment identity needs permission to create subscription deployments,
resource groups, resources, and the role assignments declared by the Bicep
templates. In practice, use `Contributor` plus `User Access Administrator` at
the target subscription scope, or an equivalent custom least-privilege role.
Use a separate identity and subscription where possible for production.

Protect the `production` GitHub environment with required reviewers and restrict
its deployment branches/tags to the release policy. The workflow deliberately
does not cancel an in-progress production deployment.
