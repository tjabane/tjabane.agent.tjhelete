# Agent Tjhelete

Agent Tjhelete is a WhatsApp-based personal finance agent for helping a user understand spending, monitor balances, and track financial goals through natural conversation and proactive updates.

The MVP focuses on financial awareness, spending control, and goal tracking. It answers questions such as:

- How much did I spend today?
- Am I still within my weekly budget?
- What are my biggest expenses this week?
- How close am I to my savings goal?

## MVP Scope

- WhatsApp conversation through Twilio
- Balance awareness for Investec account data
- Daily and weekly spend tracking
- Simple transaction categorization
- Daily and weekly budget checks
- Basic financial goal tracking
- Proactive summaries and useful alerts

The MVP does not move money, make payments, change banking details, or give regulated financial advice.

## Documentation

- [MVP product spec](docs/agent_tjhelete_mvp_product_spec.md)
- [Technical spec](docs/agent_tjhelete_tech_spec.md)
- [User journey](docs/whatsapp-personal-banking-agent-user-journey.md)
- [User stories](docs/whatsapp-personal-banking-agent-user-stories.md)

## Current Status

The synchronous private-user MVP now includes:

- a signed and validated Twilio WhatsApp webhook;
- idempotent inbound-message processing and per-user serialization;
- Cosmos-backed session history with optimistic concurrency;
- an OpenAI Responses API model adapter;
- validated read-only Investec account, balance, and transaction tools; and
- an Azure composition root and Bicep resources for the API, Cosmos containers,
  Key Vault references, and operational telemetry.

Copy `.env.example` to `.env`, replace every placeholder, and run:

```powershell
npm install
npm test
npm run dev:api
```

The configured `TWILIO_PUBLIC_WEBHOOK_URL` must exactly match the public URL
registered with Twilio, including its path and trailing slash, because it is
part of signature verification.
