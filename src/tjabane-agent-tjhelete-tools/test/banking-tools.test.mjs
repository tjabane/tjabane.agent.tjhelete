import assert from "node:assert/strict";
import { test } from "node:test";
import { DefaultAgent, DefaultToolRegistry } from "@tjabane-agent-tjhelete/agent";
import {
  GetAccountBalancesTool,
  ListAccountsTool,
  ListTransactionsTool,
  createBankingTools,
} from "../dist/index.js";

const context = {
  userId: "user-1",
  sessionId: "session-1",
  timezone: "Africa/Johannesburg",
  now: new Date("2026-08-01T10:00:00.000Z"),
};

test("banking tool factory exposes the approved model-facing tools", () => {
  const tools = createBankingTools(new FakeBankApiClient());

  assert.deepEqual(
    tools.map((tool) => tool.definition.name),
    ["list_accounts", "get_account_balances", "list_transactions"],
  );
});

test("list accounts returns safe references without provider account IDs", async () => {
  const bank = new FakeBankApiClient();
  const result = await new ListAccountsTool(bank).execute(context, {});

  assert.deepEqual(result, {
    ok: true,
    data: {
      accounts: [
        { referenceName: "Daily account", productName: "Private Bank Account" },
        { referenceName: "Savings account", productName: "Cash Management Account" },
      ],
    },
  });
  assert.equal(JSON.stringify(result).includes("account-1"), false);
});

test("account balances resolve selected safe references", async () => {
  const bank = new FakeBankApiClient();
  const result = await new GetAccountBalancesTool(bank).execute(context, {
    accountReferences: ["savings ACCOUNT"],
  });

  assert.deepEqual(bank.balanceRequests, ["account-2"]);
  assert.deepEqual(result, {
    ok: true,
    data: {
      accounts: [
        {
          referenceName: "Savings account",
          productName: "Cash Management Account",
          currentBalance: 2_000,
          availableBalance: 1_800,
          budgetBalance: 0,
          straightBalance: 0,
          cashBalance: 0,
          currency: "ZAR",
        },
      ],
    },
  });
});

test("account balances include every authorized account when references are omitted", async () => {
  const bank = new FakeBankApiClient();
  const result = await new GetAccountBalancesTool(bank).execute(context, {});

  assert.equal(result.ok, true);
  assert.deepEqual(bank.balanceRequests, ["account-1", "account-2"]);
  assert.equal(result.data.accounts.length, 2);
});

test("banking tools reject unknown account references without making account-specific calls", async () => {
  const bank = new FakeBankApiClient();
  const result = await new GetAccountBalancesTool(bank).execute(context, {
    accountReferences: ["Fabricated account"],
  });

  assert.deepEqual(result, {
    ok: false,
    error: {
      code: "account_not_found",
      message: 'No authorised account matches the reference "Fabricated account".',
      retryable: false,
    },
  });
  assert.deepEqual(bank.balanceRequests, []);
});

test("list transactions resolves accounts, includes currency, sorts, and limits results", async () => {
  const bank = new FakeBankApiClient();
  const result = await new ListTransactionsTool(bank).execute(context, {
    fromDate: "2026-07-01",
    toDate: "2026-07-31",
    accountReferences: ["Daily account"],
    transactionType: "CardPurchases",
    limit: 1,
  });

  assert.deepEqual(bank.transactionRequests, [
    {
      accountId: "account-1",
      query: {
        fromDate: "2026-07-01",
        toDate: "2026-07-31",
        transactionType: "CardPurchases",
      },
    },
  ]);
  assert.deepEqual(bank.balanceRequests, ["account-1"]);
  assert.deepEqual(result, {
    ok: true,
    data: {
      transactions: [
        {
          referenceName: "Daily account",
          description: "NEWER PURCHASE",
          direction: "debit",
          transactionType: "CardPurchases",
          postingDate: "2026-07-20",
          transactionDate: "2026-07-19",
          amount: 75,
          currency: "ZAR",
        },
      ],
      truncated: true,
    },
  });
});

test("tool argument validation returns a controlled failure", async () => {
  const bank = new FakeBankApiClient();
  const result = await new ListTransactionsTool(bank).execute(context, {
    fromDate: "2026-07-01",
    toDate: "2026-07-31",
    unsupported: true,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "invalid_arguments");
  assert.equal(result.error.retryable, false);
  assert.deepEqual(bank.transactionRequests, []);
});

test("published input schemas enforce runtime structural validation", async () => {
  const bank = new FakeBankApiClient();
  const cases = [
    [new ListAccountsTool(bank), null],
    [new ListAccountsTool(bank), { unsupported: true }],
    [new GetAccountBalancesTool(bank), { accountReferences: [] }],
    [new GetAccountBalancesTool(bank), { accountReferences: null }],
    [new GetAccountBalancesTool(bank), { accountReferences: ["   "] }],
    [new ListTransactionsTool(bank), { fromDate: "2026-07-01" }],
    [new ListTransactionsTool(bank), { fromDate: "2026-02-30", toDate: "2026-03-01" }],
    [new ListTransactionsTool(bank), { fromDate: "2026-07-01", toDate: "2026-07-31", limit: 51 }],
    [
      new ListTransactionsTool(bank),
      { fromDate: "2026-07-01", toDate: "2026-07-31", transactionType: "   " },
    ],
  ];

  for (const [tool, arguments_] of cases) {
    const result = await tool.execute(context, arguments_);
    assert.equal(result.ok, false);
    assert.equal(result.error.code, "invalid_arguments");
  }

  assert.equal(bank.accountRequests, 0);
  assert.deepEqual(bank.balanceRequests, []);
  assert.deepEqual(bank.transactionRequests, []);
});

test("domain validation runs after structural schema validation", async () => {
  const bank = new FakeBankApiClient();
  const duplicateReferences = await new GetAccountBalancesTool(bank).execute(context, {
    accountReferences: ["Savings account", " savings ACCOUNT "],
  });
  const reversedDates = await new ListTransactionsTool(bank).execute(context, {
    fromDate: "2026-07-31",
    toDate: "2026-07-01",
  });

  assert.equal(duplicateReferences.ok, false);
  assert.equal(duplicateReferences.error.code, "invalid_arguments");
  assert.equal(reversedDates.ok, false);
  assert.equal(reversedDates.error.code, "invalid_arguments");
  assert.equal(bank.accountRequests, 0);
});

test("banking provider failures become model-safe tool failures", async () => {
  const bank = new FakeBankApiClient();
  bank.accountsError = new Error("Provider credential secret leaked here.");
  const result = await new ListAccountsTool(bank).execute(context, {});

  assert.deepEqual(result, {
    ok: false,
    error: {
      code: "banking_unavailable",
      message: "Banking information is temporarily unavailable.",
      retryable: true,
    },
  });
  assert.doesNotMatch(JSON.stringify(result), /credential secret/i);
});

test("the model chooses banking tools and their order through the agent loop", async () => {
  const bank = new FakeBankApiClient();
  const registry = new DefaultToolRegistry(createBankingTools(bank));
  let modelTurn = 0;
  const modelClient = {
    async createResponse(request) {
      modelTurn += 1;

      if (modelTurn === 1) {
        assert.deepEqual(
          request.tools.map((tool) => tool.name),
          ["list_accounts", "get_account_balances", "list_transactions"],
        );
        return {
          text: "",
          toolCalls: [{ id: "call-accounts", name: "list_accounts", arguments: {} }],
        };
      }

      if (modelTurn === 2) {
        const accountResult = JSON.parse(request.history.at(-1).content);
        assert.equal(accountResult.data.accounts[1].referenceName, "Savings account");
        return {
          text: "",
          toolCalls: [
            {
              id: "call-balance",
              name: "get_account_balances",
              arguments: { accountReferences: ["Savings account"] },
            },
          ],
        };
      }

      return { text: "Your savings account has R1,800 available.", toolCalls: [] };
    },
  };
  const agent = new DefaultAgent(
    [],
    modelClient,
    registry,
    { model: "test-model", maxToolTurns: 2 },
    context,
  );

  const reply = await agent.sendMessage("What is available in my savings account?");

  assert.equal(reply, "Your savings account has R1,800 available.");
  assert.equal(modelTurn, 3);
  assert.deepEqual(bank.balanceRequests, ["account-2"]);
  assert.deepEqual(
    agent
      .getHistory()
      .filter((message) => message.role === "tool")
      .map((message) => message.name),
    ["list_accounts", "get_account_balances"],
  );
});

class FakeBankApiClient {
  accountsError;
  accountRequests = 0;
  balanceRequests = [];
  transactionRequests = [];

  accounts = [
    { id: "account-1", referenceName: "Daily account", productName: "Private Bank Account" },
    {
      id: "account-2",
      referenceName: "Savings account",
      productName: "Cash Management Account",
    },
  ];

  balances = new Map([
    [
      "account-1",
      {
        accountId: "account-1",
        currentBalance: 1_000,
        availableBalance: 900,
        budgetBalance: 0,
        straightBalance: 0,
        cashBalance: 0,
        currency: "ZAR",
      },
    ],
    [
      "account-2",
      {
        accountId: "account-2",
        currentBalance: 2_000,
        availableBalance: 1_800,
        budgetBalance: 0,
        straightBalance: 0,
        cashBalance: 0,
        currency: "ZAR",
      },
    ],
  ]);

  async getAccounts() {
    this.accountRequests += 1;
    if (this.accountsError !== undefined) {
      throw this.accountsError;
    }
    return this.accounts;
  }

  async getAccountBalance(accountId) {
    this.balanceRequests.push(accountId);
    return this.balances.get(accountId);
  }

  async getTransactions(accountId, query) {
    this.transactionRequests.push({ accountId, query });
    return [
      {
        id: "older",
        accountId,
        direction: "debit",
        transactionType: "CardPurchases",
        description: "OLDER PURCHASE",
        postingDate: "2026-07-10",
        transactionDate: "2026-07-09",
        amount: 25,
      },
      {
        id: "newer",
        accountId,
        direction: "debit",
        transactionType: "CardPurchases",
        description: "NEWER PURCHASE",
        postingDate: "2026-07-20",
        transactionDate: "2026-07-19",
        amount: 75,
      },
    ];
  }
}
