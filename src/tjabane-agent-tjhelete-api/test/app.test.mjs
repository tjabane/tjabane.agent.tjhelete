import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createApp } from "../dist/app.js";
import { createTwilioWebhookHandler } from "../dist/handlers/twilio-webhook-handler.js";

const servers = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );
});

test("injects the inbound message service into the Twilio webhook", async () => {
  const receivedMessages = [];
  const inboundMessages = {
    async handle(message) {
      receivedMessages.push(message);
      return "You spent R120 today & remain within budget.";
    },
  };
  const app = createApp({
    twilioWebhookHandler: createTwilioWebhookHandler(inboundMessages),
  });
  const server = app.listen(0);
  servers.push(server);

  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");

  const response = await globalThis.fetch(`http://127.0.0.1:${address.port}/webhooks/twilio`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new globalThis.URLSearchParams({
      Body: "How much did I spend?",
      From: "whatsapp:+27000000000",
      To: "whatsapp:+27111111111",
      MessageSid: "SM123",
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type")?.includes("application/json"), true);
  assert.deepEqual(await response.json(), {
    message: "You spent R120 today & remain within budget.",
  });
  assert.deepEqual(receivedMessages, [
    {
      channel: "whatsapp",
      text: "How much did I spend?",
      externalSenderId: "whatsapp:+27000000000",
      externalRecipientId: "whatsapp:+27111111111",
      providerMessageId: "SM123",
    },
  ]);
});
