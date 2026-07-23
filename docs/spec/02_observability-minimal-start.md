# Minimal Observability Starting Point

## Purpose

This document proposes the smallest useful observability foundation for Agent
Tjhelete. It is deliberately designed to avoid manual OpenTelemetry spans in
the agent, domain, repository, or service code.

The first implementation should answer operational questions:

- Is the webhook API available and responding successfully?
- How long do inbound requests and outbound HTTP calls take?
- Which dependencies fail?
- Did an unhandled exception occur?
- Can an operator correlate safe structured logs with the request that caused
  them?

It does **not** aim to evaluate agent quality, capture prompts, or record
financial conversation content.

## Decision

Use the Azure Monitor OpenTelemetry distribution for the Node.js API and send
data to one Azure Application Insights resource.

This means:

- **OpenTelemetry** is the standard instrumentation mechanism, kept at the
  process boundary.
- **Application Insights** is the initial telemetry destination, dashboards,
  alerting, and query surface.
- **Automatic instrumentation** is preferred. No application class receives a
  tracer, and no business method creates a span.
- **Structured logs** replace `console.log`; only explicitly safe fields may
  be logged.

The Azure distribution is configured once during API process startup, before
Express or other instrumented modules are loaded. This ordering matters for
ESM auto-instrumentation.

## Scope of the first implementation

### Include

- Incoming HTTP request telemetry for the Express API, including status and
  duration.
- Outgoing HTTP/HTTPS dependency telemetry, initially covering calls made via
  `fetch` to Twilio, OpenAI, Investec, and other providers.
- Unhandled exceptions and process-level failures.
- Basic Node.js process/runtime metrics supplied by the distribution.
- Structured application logs at `info`, `warn`, and `error` levels, with
  correlation to the active request where the logging integration supports it.
- A health endpoint exclusion/filter so routine probes do not add noise or
  cost.

### Explicitly exclude

- Manual spans in `ConversationOrchestrator`, `Agent`, `ToolRegistry`,
  `ModelClient`, repositories, or provider clients.
- Automatic capture of request/response bodies, prompts, tool arguments, model
  responses, or HTTP authorization headers.
- User phone numbers, WhatsApp message IDs, account IDs, transaction details,
  balance amounts, goals, or raw errors containing provider payloads.
- LangChain and LangSmith dependencies.
- Custom metrics, dashboards, alerts, and scheduled-job instrumentation. They
  can be added only when a concrete operational question requires them.

## Privacy and financial-data rules

This is a personal-finance product. Telemetry must never become a second copy
of customer financial data.

Do not emit the following to logs, trace attributes, exception properties, or
custom events:

- WhatsApp message bodies or model prompts/responses.
- Phone numbers, account identifiers, access tokens, API keys, and webhook
  signatures.
- Transaction descriptions, merchants, amounts, balances, categories, or
  goals.
- Full provider error bodies, because they can include request details.

Safe fields are limited to low-cardinality operational values such as HTTP
method, route template, status code, dependency host, error type, deployment
environment, and application version. If a future use case requires a
customer/session reference, use a one-way keyed hash and document its purpose,
retention, and access controls first.

The existing webhook handler currently logs the whole `IncomingMessage` object.
That log must be removed or replaced as part of the initial work, because it
contains WhatsApp message content and phone numbers.

## Proposed implementation shape

Create one startup-only module, for example `src/telemetry.ts`, owned by the
API composition root. Its responsibilities are limited to configuring the Azure
Monitor distribution from environment variables and its approved filters.

The server entry point loads this module before it imports or constructs the
Express application. The application modules retain their current contracts;
they do not depend on Azure, OpenTelemetry, or a telemetry abstraction.

```text
process startup
  -> telemetry bootstrap (one time)
  -> Express/API composition root
  -> existing application modules

Express + HTTP client libraries
  -> automatic instrumentation
  -> Application Insights
```

The minimal configuration will use:

- `APPLICATIONINSIGHTS_CONNECTION_STRING` for the Azure destination.
- A stable service name, for example `tjabane-agent-tjhelete-api`.
- An explicit deployment environment value.
- Default rate-limited trace sampling initially, plus an Application Insights
  daily cap as a cost safety net.

For ESM, the Node start command must register the Azure Monitor loader before
the application entry point. We will validate the exact build/start command
when implementation starts.

## What Application Insights should show after this change

Without adding manual spans, an operator should be able to see:

- Request rate, latency, and HTTP failures for `/webhooks/twilio`.
- Slow or failed outbound provider calls grouped by destination.
- Exceptions correlated with the request/dependency operation that failed.
- API process availability and basic resource usage.

This is sufficient for a first production service baseline. It does not make
the internal agent reasoning observable, by design.

## LangChain and LangSmith: deferred comparison

LangChain is an application framework for building LLM workflows; LangSmith is
its companion tracing, evaluation, and debugging platform. Their tracing is
valuable when we need to inspect model prompts, tool calls, intermediate agent
steps, datasets, or evaluations.

That is a different telemetry layer from minimal service health monitoring.
Adopting LangChain only for LangSmith would couple the agent implementation to
that framework before we have established that its workflow abstractions fit
our `Agent`, `ModelClient`, and future `ToolRegistry` design. It would also
require a separate privacy review because prompt/tool traces are likely to
contain highly sensitive financial data.

Therefore, do not adopt LangChain or enable LangSmith tracing in the baseline.
Revisit the decision after the agent loop and model adapter exist, using a small
proof of concept with synthetic data. At that time we can compare:

1. LangSmith tracing with carefully selected redaction and retention controls.
2. A provider-neutral LLM observability integration.
3. Application Insights-only operational telemetry plus a domain audit trail.

## Later, only when justified

Manual instrumentation is permitted only when automatic collection cannot
answer a recurring operational question. Each addition needs a named owner,
privacy classification, and a clear question, for example:

| Question | Possible later signal |
| --- | --- |
| Are scheduled summaries completing? | One job outcome metric/event per run; no customer payload. |
| Which approved tool fails most often? | A bounded `tool.name` and outcome metric. |
| Is model cost/latency becoming a problem? | Provider latency and token-count metrics, with no prompt content. |
| Is the agent helpful? | An opt-in evaluation/audit design, not production request traces by default. |

## Acceptance criteria for the baseline

- Starting the API with no connection string remains safe: telemetry is
  disabled and the API still starts.
- Starting with a valid connection string produces request and dependency data
  in the intended Application Insights resource.
- Health probes are filtered or sampled according to the chosen policy.
- No existing log statement emits a message body, phone number, account data,
  token, or provider response body.
- The domain/agent/service module public APIs remain unchanged.
- Tests verify startup configuration and safe logging behavior without making
  live Azure calls.

## Reading

- [Azure Monitor OpenTelemetry for Node.js](https://learn.microsoft.com/en-us/javascript/api/overview/azure/monitor-opentelemetry-readme?view=azure-node-latest)
- [Enable OpenTelemetry in Application Insights](https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-enable)
- [Automatic data collection and resource detectors](https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-collect-detect)
- [Azure Monitor sampling guidance](https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-sampling)
- [Application Insights OpenTelemetry filtering guidance](https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-filter)
- [LangSmith documentation](https://docs.smith.langchain.com/)
- [LangChain JavaScript documentation](https://js.langchain.com/docs/)
