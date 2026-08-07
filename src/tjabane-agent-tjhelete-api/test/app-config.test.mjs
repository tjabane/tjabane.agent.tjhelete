import assert from "node:assert/strict";
import { test } from "node:test";
import { loadAppConfig } from "../dist/config/app-config.js";

test("configuration fails startup with the missing setting name", () => {
  const environment = validEnvironment();
  delete environment.OPENAI_API_KEY;

  assert.throws(() => loadAppConfig(environment), /OPENAI_API_KEY/);
});

test("configuration parses validated immutable values", () => {
  const config = loadAppConfig(validEnvironment());

  assert.equal(config.port, 3000);
  assert.equal(config.openAi.model, "gpt-5.6-sol");
  assert.equal(config.timezone, "Africa/Johannesburg");
  assert.equal(config.twilio.publicWebhookUrl.toString(), "https://example.test/webhooks/twilio/");
});

function validEnvironment() {
  return {
    TWILIO_PUBLIC_WEBHOOK_URL: "https://example.test/webhooks/twilio/",
    TWILIO_AUTH_TOKEN: "twilio-secret",
    TWILIO_ALLOWED_WHATSAPP_SENDER: "whatsapp:+27000000000",
    APP_INTERNAL_USER_ID: "internal-user",
    OPENAI_API_KEY: "openai-secret",
    COSMOS_ENDPOINT: "https://cosmos.test/",
    INVESTEC_BASE_URL: "https://investec.test/",
    INVESTEC_TOKEN_URL: "https://investec.test/token",
    INVESTEC_CLIENT_ID: "client-id",
    INVESTEC_CLIENT_SECRET: "client-secret",
    INVESTEC_API_KEY: "api-key",
  };
}
