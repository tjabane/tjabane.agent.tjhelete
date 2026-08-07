import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import {
  ConversationOrchestrator,
  DefaultAgentFactory,
  DefaultToolRegistry,
} from "@tjabane-agent-tjhelete/agent";
import { DefaultInboundMessageService } from "../dist/application/default-inbound-message-service.js";
import { DefaultSessionResolver } from "../dist/application/default-session-resolver.js";
import { StaticUserIdentityResolver } from "../dist/application/static-user-identity-resolver.js";
import { createApp } from "../dist/app.js";
import { createTwilioWebhookHandler } from "../dist/handlers/twilio-webhook-handler.js";
import { createTwilioSignatureVerifier } from "../dist/middleware/twilio-signature-verifier.js";

test("a signed webhook reaches the model and persists the conversation", async (context) => {
  const publicUrl = "https://example.test/webhooks/twilio/";
  const authToken = "test-auth-token";
  const sessions = new MemorySessionStore();
  const modelRequests = [];
  const modelClient = {
    async createResponse(request) {
      modelRequests.push(request);
      return { text: "Your balance is available.", toolCalls: [] };
    },
  };
  const agentFactory = new DefaultAgentFactory(modelClient, new DefaultToolRegistry([]), {
    model: "test-model",
    maxToolTurns: 2,
  });
  const orchestrator = new ConversationOrchestrator(sessions, agentFactory, {
    timezone: "Africa/Johannesburg",
    now: () => new Date("2026-08-01T10:00:00.000Z"),
  });
  const inboundMessages = new DefaultInboundMessageService(
    new MemoryInbox(),
    new StaticUserIdentityResolver("whatsapp:+27000000000", "user-1"),
    new DefaultSessionResolver(
      sessions,
      [{ role: "system", content: "System prompt" }],
      () => "session-1",
    ),
    orchestrator,
  );
  const app = createApp({
    twilioWebhookHandler: createTwilioWebhookHandler(inboundMessages),
    verifyTwilioSignature: createTwilioSignatureVerifier(new globalThis.URL(publicUrl), authToken),
  });
  const server = app.listen(0);
  context.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");
  const form = new globalThis.URLSearchParams({
    Body: "What is my balance?",
    From: "whatsapp:+27000000000",
    To: "whatsapp:+27111111111",
    MessageSid: "SMe2e1",
  });
  let signatureInput = publicUrl;
  for (const key of [...form.keys()].sort()) {
    signatureInput += `${key}${form.get(key)}`;
  }

  const response = await globalThis.fetch(`http://127.0.0.1:${address.port}/webhooks/twilio`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-twilio-signature": createHmac("sha1", authToken).update(signatureInput).digest("base64"),
    },
    body: form,
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { message: "Your balance is available." });
  assert.equal(modelRequests.length, 1);
  assert.deepEqual(sessions.current.history, [
    { role: "system", content: "System prompt" },
    { role: "user", content: "What is my balance?" },
    { role: "assistant", content: "Your balance is available." },
  ]);
});

class MemorySessionStore {
  current = null;

  async findById(id) {
    return this.current?.id === id ? structuredCopy(this.current) : null;
  }

  async findByUserId(userId) {
    return this.current?.userId === userId ? structuredCopy(this.current) : null;
  }

  async create(session) {
    if (this.current !== null) {
      return false;
    }
    this.current = structuredCopy(session);
    return true;
  }

  async save(session) {
    this.current = structuredCopy(session);
  }
}

class MemoryInbox {
  records = new Map();

  async begin(id) {
    const record = this.records.get(id);
    if (record?.status === "completed") {
      return { status: "completed", reply: record.reply };
    }
    if (record?.status === "processing") {
      return { status: "processing" };
    }
    this.records.set(id, { status: "processing" });
    return { status: "claimed" };
  }

  async complete(id, reply) {
    this.records.set(id, { status: "completed", reply });
  }

  async fail(id) {
    this.records.set(id, { status: "failed" });
  }
}

function structuredCopy(value) {
  return globalThis.structuredClone(value);
}
