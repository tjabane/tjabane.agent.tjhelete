/* global AbortController */

import assert from "node:assert/strict";
import { test } from "node:test";
import { URL } from "node:url";
import {
  HttpNetworkError,
  HttpRequestCancelledError,
  HttpStatusError,
  RetryingHttpClient,
} from "../dist/index.js";

const request = {
  method: "GET",
  url: new URL("https://example.test/resource"),
};
const success = { status: 200, body: { ok: true }, headers: {} };

test("RetryingHttpClient retries transient failures with exponential backoff", async () => {
  const outcomes = [new HttpStatusError(503), new HttpNetworkError(), success];
  const delays = [];
  const innerClient = {
    calls: 0,
    async request() {
      this.calls += 1;
      const outcome = outcomes.shift();
      if (outcome instanceof Error) throw outcome;
      return outcome;
    },
  };
  const client = new RetryingHttpClient(
    innerClient,
    { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100 },
    async (delayMs) => delays.push(delayMs),
  );

  assert.equal(await client.request(request), success);
  assert.equal(innerClient.calls, 3);
  assert.deepEqual(delays, [10, 20]);
});

test("RetryingHttpClient honours Retry-After within the configured delay ceiling", async () => {
  const outcomes = [new HttpStatusError(429, "2"), success];
  const delays = [];
  const client = new RetryingHttpClient(
    {
      async request() {
        const outcome = outcomes.shift();
        if (outcome instanceof Error) throw outcome;
        return outcome;
      },
    },
    { maxAttempts: 2, baseDelayMs: 10, maxDelayMs: 5_000 },
    async (delayMs) => delays.push(delayMs),
  );

  await client.request(request);

  assert.deepEqual(delays, [2_000]);
});

test("RetryingHttpClient does not retry permanent failures or POST by default", async () => {
  for (const options of [request, { ...request, method: "POST" }]) {
    let calls = 0;
    const failure = options.method === "GET" ? new HttpStatusError(400) : new HttpStatusError(503);
    const client = new RetryingHttpClient({
      async request() {
        calls += 1;
        throw failure;
      },
    });

    await assert.rejects(
      () => client.request(options),
      (error) => error === failure,
    );
    assert.equal(calls, 1);
  }
});

test("RetryingHttpClient retries POST only when explicitly enabled", async () => {
  const outcomes = [new HttpStatusError(503), success];
  const client = new RetryingHttpClient(
    {
      async request() {
        const outcome = outcomes.shift();
        if (outcome instanceof Error) throw outcome;
        return outcome;
      },
    },
    { baseDelayMs: 0 },
    async () => {},
  );

  assert.equal(await client.request({ ...request, method: "POST", retryable: true }), success);
});

test("RetryingHttpClient never retries caller cancellation", async () => {
  const abortController = new AbortController();
  abortController.abort();
  let calls = 0;
  const client = new RetryingHttpClient({
    async request() {
      calls += 1;
      return success;
    },
  });

  await assert.rejects(
    () => client.request({ ...request, signal: abortController.signal }),
    HttpRequestCancelledError,
  );
  assert.equal(calls, 0);
});
