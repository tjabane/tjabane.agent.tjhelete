/* global AbortController, DOMException, ReadableStream, Response */

import assert from "node:assert/strict";
import { test } from "node:test";
import { URL } from "node:url";
import {
  FetchHttpClient,
  HttpBodyParseError,
  HttpRequestCancelledError,
  HttpStatusError,
  HttpTimeoutError,
} from "../dist/index.js";

test("FetchHttpClient parses successful JSON responses", async () => {
  const client = new FetchHttpClient(async () => {
    return new Response(JSON.stringify({ result: "ok" }), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "x-request-id": "request-1",
      },
    });
  });

  const response = await client.request({
    method: "GET",
    url: new URL("https://example.test/resource"),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { result: "ok" });
  assert.equal(response.headers["x-request-id"], "request-1");
});

test("FetchHttpClient returns text for non-JSON responses and null for empty responses", async () => {
  const responses = [
    new Response("plain text", {
      status: 200,
      headers: { "content-type": "text/plain" },
    }),
    new Response(null, { status: 204 }),
  ];
  const client = new FetchHttpClient(async () => responses.shift());

  const textResponse = await client.request({
    method: "GET",
    url: new URL("https://example.test/text"),
  });
  const emptyResponse = await client.request({
    method: "GET",
    url: new URL("https://example.test/empty"),
  });

  assert.equal(textResponse.body, "plain text");
  assert.equal(emptyResponse.body, null);
});

test("FetchHttpClient throws HttpStatusError without exposing the response body", async () => {
  const client = new FetchHttpClient(async () => {
    return new Response(JSON.stringify({ secret: "do-not-expose" }), {
      status: 429,
      headers: { "retry-after": "15" },
    });
  });

  await assert.rejects(
    () =>
      client.request({
        method: "GET",
        url: new URL("https://example.test/rate-limited"),
      }),
    (error) => {
      assert.ok(error instanceof HttpStatusError);
      assert.equal(error.status, 429);
      assert.equal(error.retryAfter, "15");
      assert.doesNotMatch(error.message, /do-not-expose/);
      return true;
    },
  );
});

test("FetchHttpClient releases unsuccessful response bodies", async () => {
  let responseBodyCancelled = false;
  const client = new FetchHttpClient(async () => {
    return new Response(
      new ReadableStream({
        cancel() {
          responseBodyCancelled = true;
        },
      }),
      { status: 503 },
    );
  });

  await assert.rejects(
    () =>
      client.request({
        method: "GET",
        url: new URL("https://example.test/unavailable"),
      }),
    HttpStatusError,
  );
  assert.equal(responseBodyCancelled, true);
});

test("FetchHttpClient preserves the status error when response cleanup fails", async () => {
  const client = new FetchHttpClient(async () => {
    return new Response(
      new ReadableStream({
        cancel() {
          throw new Error("cleanup failed");
        },
      }),
      { status: 503 },
    );
  });

  await assert.rejects(
    () =>
      client.request({
        method: "GET",
        url: new URL("https://example.test/unavailable"),
      }),
    (error) => {
      assert.ok(error instanceof HttpStatusError);
      assert.equal(error.status, 503);
      return true;
    },
  );
});

test("FetchHttpClient rejects malformed declared JSON", async () => {
  const client = new FetchHttpClient(async () => {
    return new Response("{not-json", {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  await assert.rejects(
    () =>
      client.request({
        method: "GET",
        url: new URL("https://example.test/invalid-json"),
      }),
    HttpBodyParseError,
  );
});

test("FetchHttpClient distinguishes timeout from caller cancellation", async () => {
  const neverCompletes = async (_url, init) => {
    await new Promise((_, reject) => {
      init.signal.addEventListener(
        "abort",
        () => reject(new DOMException("Aborted", "AbortError")),
        { once: true },
      );
    });
  };
  const client = new FetchHttpClient(neverCompletes);

  await assert.rejects(
    () =>
      client.request({
        method: "GET",
        url: new URL("https://example.test/timeout"),
        timeoutMs: 5,
      }),
    HttpTimeoutError,
  );

  const abortController = new AbortController();
  const request = client.request({
    method: "GET",
    url: new URL("https://example.test/cancel"),
    signal: abortController.signal,
  });
  abortController.abort();

  await assert.rejects(request, HttpRequestCancelledError);
});
