import assert from "node:assert/strict";
import { test } from "node:test";
import { URL } from "node:url";
import { DefaultInvestecAccessTokenProvider } from "../dist/index.js";
import { FakeHttpClient } from "./utils/fake-http-client.mjs";

test("Investec token provider sends the documented client-credentials request and caches the token", async () => {
  let now = 1_000;
  const httpClient = new FakeHttpClient([
    {
      status: 200,
      body: {
        access_token: "access-token-1",
        token_type: "Bearer",
        expires_in: 10,
        scope: "accounts",
      },
      headers: {},
    },
    {
      status: 200,
      body: {
        access_token: "access-token-2",
        token_type: "Bearer",
        expires_in: 10,
        scope: "accounts",
      },
      headers: {},
    },
  ]);
  const provider = new DefaultInvestecAccessTokenProvider(
    httpClient,
    new URL("https://openapi.test/identity/v2/oauth2/token"),
    "client",
    "secret",
    "api-key",
    5_000,
    1_000,
    () => now,
  );

  assert.equal(await provider.getAccessToken(), "access-token-1");
  assert.equal(await provider.getAccessToken(), "access-token-1");
  assert.equal(httpClient.requests.length, 1);
  assert.deepEqual(httpClient.requests[0], {
    method: "POST",
    url: new URL("https://openapi.test/identity/v2/oauth2/token"),
    headers: {
      Accept: "application/json",
      Authorization: "Basic Y2xpZW50OnNlY3JldA==",
      "Content-Type": "application/x-www-form-urlencoded",
      "x-api-key": "api-key",
    },
    body: "grant_type=client_credentials",
    timeoutMs: 5_000,
    retryable: true,
  });

  now = 10_000;

  assert.equal(await provider.getAccessToken(), "access-token-2");
  assert.equal(httpClient.requests.length, 2);
});

test("Investec token provider shares an in-flight acquisition", async () => {
  let completeRequest;
  const httpClient = {
    requests: [],
    request(options) {
      this.requests.push(options);

      return new Promise((resolve) => {
        completeRequest = resolve;
      });
    },
  };
  const provider = new DefaultInvestecAccessTokenProvider(
    httpClient,
    new URL("https://openapi.test/identity/v2/oauth2/token"),
    "client",
    "secret",
    "api-key",
  );
  const first = provider.getAccessToken();
  const second = provider.getAccessToken();

  assert.equal(httpClient.requests.length, 1);

  completeRequest({
    status: 200,
    body: {
      access_token: "shared-token",
      token_type: "Bearer",
      expires_in: 1799,
      scope: "accounts",
    },
    headers: {},
  });

  assert.deepEqual(await Promise.all([first, second]), ["shared-token", "shared-token"]);
});

test("Investec token provider validates the token response at runtime", async () => {
  const provider = new DefaultInvestecAccessTokenProvider(
    new FakeHttpClient([
      {
        status: 200,
        body: {
          access_token: "",
          token_type: "Bearer",
          expires_in: 1799,
          scope: "accounts",
        },
        headers: {},
      },
    ]),
    new URL("https://openapi.test/identity/v2/oauth2/token"),
    "client",
    "secret",
    "api-key",
  );

  await assert.rejects(
    () => provider.getAccessToken(),
    (error) => {
      assert.equal(error.name, "ProviderResponseValidationError");
      assert.match(error.message, /access_token/);
      return true;
    },
  );
});
