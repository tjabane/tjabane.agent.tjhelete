import { createHmac, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";

export function createTwilioSignatureVerifier(
  publicWebhookUrl: URL,
  authToken: string,
): RequestHandler {
  if (authToken.length === 0) {
    throw new Error("Twilio auth token must be non-empty.");
  }

  return function verifyTwilioSignature(request, response, next): void {
    const suppliedSignature = request.header("x-twilio-signature");
    const form = readForm(request.body);

    if (
      suppliedSignature === undefined ||
      form === null ||
      !isValidSignature(publicWebhookUrl.toString(), form, authToken, suppliedSignature)
    ) {
      response.status(403).json({ message: "Forbidden." });
      return;
    }

    next();
  };
}

function isValidSignature(
  url: string,
  form: Readonly<Record<string, string>>,
  authToken: string,
  suppliedSignature: string,
): boolean {
  const data = Object.keys(form)
    .sort()
    .reduce((value, key) => `${value}${key}${form[key]}`, url);
  const expectedSignature = createHmac("sha1", authToken).update(data, "utf8").digest("base64");
  const supplied = Buffer.from(suppliedSignature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function readForm(value: unknown): Readonly<Record<string, string>> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const form: Record<string, string> = {};

  for (const [key, fieldValue] of Object.entries(value)) {
    if (typeof fieldValue !== "string") {
      return null;
    }

    form[key] = fieldValue;
  }

  return form;
}
