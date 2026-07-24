import assert from "node:assert/strict";
import { test } from "node:test";
import { URL } from "node:url";
import { InvestecBankApiClient } from "../dist/index.js";

test("Investec client requests and maps posted transactions", async () => {
  const httpClient = new FakeHttpClient(createResponse());
  const accessTokens = {
    getAccessToken: async () => "bank-token",
  };
  const client = new InvestecBankApiClient(
    httpClient,
    accessTokens,
    new URL("https://openapi.test"),
    7_500,
  );

  const transactions = await client.getTransactions("account-1", {
    fromDate: "2026-07-01",
    toDate: "2026-07-24",
    transactionType: "CardPurchases",
  });

  assert.deepEqual(httpClient.requests, [
    {
      method: "GET",
      url: new URL(
        "https://openapi.test/za/pb/v1/accounts/account-1/transactions?fromDate=2026-07-01&toDate=2026-07-24&transactionType=CardPurchases",
      ),
      headers: {
        Accept: "application/json",
        Authorization: "Bearer bank-token",
      },
      timeoutMs: 7_500,
    },
  ]);
  assert.deepEqual(transactions, [
    {
      id: "32224202006110013379",
      accountId: "account-1",
      direction: "debit",
      transactionType: "CardPurchases",
      description: "SHOP PURCHASE",
      postingDate: "2026-07-20",
      transactionDate: "2026-07-19",
      amount: 53.6,
    },
  ]);
});

test("Investec client rejects invalid queries before acquiring a token", async () => {
  let tokenRequests = 0;
  const client = new InvestecBankApiClient(
    new FakeHttpClient(createResponse()),
    {
      getAccessToken: async () => {
        tokenRequests += 1;
        return "bank-token";
      },
    },
    new URL("https://openapi.test"),
  );

  await assert.rejects(
    () =>
      client.getTransactions("account-1", {
        fromDate: "2026-02-30",
        toDate: "2026-07-24",
      }),
    /fromDate/,
  );
  await assert.rejects(
    () =>
      client.getTransactions("account-1", {
        fromDate: "2026-07-24",
        toDate: "2026-07-01",
      }),
    /must not be after/,
  );
  assert.equal(tokenRequests, 0);
});

test("Investec client validates provider transaction fields", async () => {
  const response = createResponse();
  response.body.data.transactions[0].postingDate = "2026-02-30";
  const client = new InvestecBankApiClient(
    new FakeHttpClient(response),
    { getAccessToken: async () => "bank-token" },
    new URL("https://openapi.test"),
  );

  await assert.rejects(
    () =>
      client.getTransactions("account-1", {
        fromDate: "2026-07-01",
        toDate: "2026-07-24",
      }),
    (error) => {
      assert.equal(error.name, "ProviderResponseValidationError");
      assert.match(error.message, /postingDate/);
      return true;
    },
  );
});

test("Investec client fails rather than returning an incomplete undocumented page", async () => {
  const response = createResponse();
  response.body.meta.totalPages = 2;
  const client = new InvestecBankApiClient(
    new FakeHttpClient(response),
    { getAccessToken: async () => "bank-token" },
    new URL("https://openapi.test"),
  );

  await assert.rejects(
    () =>
      client.getTransactions("account-1", {
        fromDate: "2026-07-01",
        toDate: "2026-07-24",
      }),
    /totalPages is greater than one/,
  );
});

test("Investec client rejects transactions belonging to another account", async () => {
  const response = createResponse();
  response.body.data.transactions[0].accountId = "account-2";
  const client = new InvestecBankApiClient(
    new FakeHttpClient(response),
    { getAccessToken: async () => "bank-token" },
    new URL("https://openapi.test"),
  );

  await assert.rejects(
    () =>
      client.getTransactions("account-1", {
        fromDate: "2026-07-01",
        toDate: "2026-07-24",
      }),
    /does not match the requested account/,
  );
});

class FakeHttpClient {
  requests = [];

  constructor(response) {
    this.response = response;
  }

  async request(options) {
    this.requests.push(options);
    return this.response;
  }
}

function createResponse() {
  return {
    status: 200,
    body: {
      data: {
        transactions: [
          {
            accountId: "account-1",
            type: "DEBIT",
            transactionType: "CardPurchases",
            status: "POSTED",
            description: "SHOP PURCHASE",
            cardNumber: "402261xxxxxx0011",
            postedOrder: 13379,
            postingDate: "2026-07-20",
            valueDate: "2026-07-20",
            actionDate: "2026-07-19",
            transactionDate: "2026-07-19",
            amount: 53.6,
            runningBalance: 1_234.56,
            uuid: "32224202006110013379",
          },
        ],
      },
      links: {
        self: "https://openapi.test/za/pb/v1/accounts/account-1/transactions",
      },
      meta: {
        totalPages: 1,
      },
    },
    headers: {},
  };
}
