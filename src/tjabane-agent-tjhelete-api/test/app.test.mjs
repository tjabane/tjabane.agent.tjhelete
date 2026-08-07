import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { afterEach, test } from "node:test";
import { createApp } from "../dist/app.js";
import { createTwilioWebhookHandler } from "../dist/handlers/twilio-webhook-handler.js";
import { createTwilioSignatureVerifier } from "../dist/middleware/twilio-signature-verifier.js";

const publicWebhookUrl = "https://example.test/webhooks/twilio/";
const authToken = "test-auth-token";
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

test("a signed valid webhook returns the application reply as JSON", async () => {
  const receivedMessages = [];
  const inboundMessages = {
    async handle(message) {
      receivedMessages.push(message);
      return "You spent R120 today & remain within budget.";
    },
  };
  const form = validForm();
  const response = await postWebhook(inboundMessages, form, sign(form));

  assert.equal(response.status, 200);
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

test("an invalid signature is rejected before application logic runs", async () => {
  let invocationCount = 0;
  const response = await postWebhook(
    {
      async handle() {
        invocationCount += 1;
        return "Must not run";
      },
    },
    validForm(),
    "invalid-signature",
  );

  assert.equal(response.status, 403);
  assert.equal(invocationCount, 0);
});

test("missing required fields are rejected", async () => {
  let invocationCount = 0;
  const form = validForm();
  form.delete("MessageSid");
  const response = await postWebhook(
    {
      async handle() {
        invocationCount += 1;
        return "Must not run";
      },
    },
    form,
    sign(form),
  );

  assert.equal(response.status, 400);
  assert.equal(invocationCount, 0);
});

test("dependency failures return a safe response", async () => {
  const form = validForm();
  const response = await postWebhook(
    {
      async handle() {
        throw new Error("provider response included sensitive details");
      },
    },
    form,
    sign(form),
  );

  assert.equal(response.status, 503);
  const responseBody = JSON.stringify(await response.json());
  assert.doesNotMatch(responseBody, /provider|sensitive/i);
});

async function postWebhook(inboundMessages, form, signature) {
  const app = createApp({
    twilioWebhookHandler: createTwilioWebhookHandler(inboundMessages),
    verifyTwilioSignature: createTwilioSignatureVerifier(
      new globalThis.URL(publicWebhookUrl),
      authToken,
    ),
  });
  const server = app.listen(0);
  servers.push(server);
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");

  return globalThis.fetch(`http://127.0.0.1:${address.port}/webhooks/twilio`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-twilio-signature": signature,
    },
    body: form,
  });
}

function validForm() {
  return new globalThis.URLSearchParams({
    Body: "How much did I spend?",
    From: "whatsapp:+27000000000",
    To: "whatsapp:+27111111111",
    MessageSid: "SM123",
  });
}

function sign(form) {
  let data = publicWebhookUrl;

  for (const key of [...form.keys()].sort()) {
    data += `${key}${form.get(key)}`;
  }

  return createHmac("sha1", authToken).update(data, "utf8").digest("base64");
}
