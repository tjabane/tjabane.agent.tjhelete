import { CosmosClient } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";
import {
  ConversationOrchestrator,
  DefaultAgentFactory,
  DefaultToolRegistry,
} from "@tjabane-agent-tjhelete/agent";
import { CosmosDatabaseClient, SessionRepository } from "@tjabane-agent-tjhelete/repository";
import {
  DefaultInvestecAccessTokenProvider,
  FetchHttpClient,
  InvestecBankApiClient,
  OpenAiResponsesModelClient,
  RetryingHttpClient,
} from "@tjabane-agent-tjhelete/services";
import { createBankingTools } from "@tjabane-agent-tjhelete/tools";
import type { Express } from "express";
import { DefaultInboundMessageService } from "../application/default-inbound-message-service.js";
import { DefaultSessionResolver } from "../application/default-session-resolver.js";
import { StaticUserIdentityResolver } from "../application/static-user-identity-resolver.js";
import { createApp } from "../app.js";
import type { AppConfig } from "../config/app-config.js";
import { createTwilioWebhookHandler } from "../handlers/twilio-webhook-handler.js";
import { DatabaseInboundMessageRepository } from "../infrastructure/database-inbound-message-repository.js";
import { createTwilioSignatureVerifier } from "../middleware/twilio-signature-verifier.js";

export interface Application {
  readonly app: Express;
  readonly config: AppConfig;
  readonly dispose: () => Promise<void>;
}

export function createApplication(config: AppConfig): Application {
  const credential = new DefaultAzureCredential();
  const cosmosClient = new CosmosClient({
    endpoint: config.cosmos.endpoint,
    aadCredentials: credential,
  });
  const database = new CosmosDatabaseClient(cosmosClient, config.cosmos.databaseName);
  const sessions = new SessionRepository(database, config.cosmos.sessionsContainerName);

  const fetchHttpClient = new FetchHttpClient();
  const retryingHttpClient = new RetryingHttpClient(fetchHttpClient);
  const investecAccessTokens = new DefaultInvestecAccessTokenProvider(
    retryingHttpClient,
    config.investec.tokenUrl,
    config.investec.clientId,
    config.investec.clientSecret,
    config.investec.apiKey,
    config.investec.timeoutMs,
  );
  const bankApiClient = new InvestecBankApiClient(
    retryingHttpClient,
    investecAccessTokens,
    config.investec.baseUrl,
    config.investec.timeoutMs,
  );
  const toolRegistry = new DefaultToolRegistry(createBankingTools(bankApiClient));
  const modelClient = new OpenAiResponsesModelClient(fetchHttpClient, config.openAi.apiKey, {
    endpoint: config.openAi.endpoint,
    timeoutMs: config.openAi.timeoutMs,
  });
  const agentFactory = new DefaultAgentFactory(modelClient, toolRegistry, {
    model: config.openAi.model,
    maxToolTurns: config.maxToolTurns,
  });
  const orchestrator = new ConversationOrchestrator(sessions, agentFactory, {
    timezone: config.timezone,
  });
  const identities = new StaticUserIdentityResolver(
    config.twilio.allowedSender,
    config.twilio.internalUserId,
  );
  const sessionResolver = new DefaultSessionResolver(sessions, [
    { role: "system", content: config.systemPrompt },
  ]);
  const inboundMessageRepository = new DatabaseInboundMessageRepository(database, {
    collectionName: config.cosmos.inboundMessagesContainerName,
  });
  const inboundMessages = new DefaultInboundMessageService(
    inboundMessageRepository,
    identities,
    sessionResolver,
    orchestrator,
  );
  const twilioWebhookHandler = createTwilioWebhookHandler(inboundMessages);
  const verifyTwilioSignature = createTwilioSignatureVerifier(
    config.twilio.publicWebhookUrl,
    config.twilio.authToken,
  );
  const app = createApp({ twilioWebhookHandler, verifyTwilioSignature });

  return {
    app,
    config,
    dispose: async () => {
      cosmosClient.dispose();
    },
  };
}
