# Tool Registry Design Review Actions

This document records the findings from the 2026-08-01 review of the tool registry design against the current codebase. It is an action tracker; each item should be addressed independently and moved to `Resolved` only when the relevant design and implementation are complete.

All findings and proposed solutions assume that Agent Tjhelete is a single-user application. Multi-user tenancy, per-user bank credentials, and user-to-bank-connection mapping are outside scope.

## Status meanings

- `Planned`: accepted finding that has not yet been addressed.
- `Design resolved`: the design decision is recorded, but implementation remains.
- `In progress`: part of the implementation is complete, but required work remains.
- `Resolved`: design, implementation, and proportionate tests are complete.

## High priority

| ID  | Status   | Finding                                                                                                                                    | Required outcome                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| H1  | Resolved | The current `BankApiClient` uses account-specific balance and transaction endpoints, while model-facing tools need safe account selection. | `list_accounts`, `get_account_balances`, and `list_transactions` resolve safe reference names against the current Investec-authorised account list. Omitted references include all accounts, unknown or ambiguous references fail safely, provider account identifiers remain internal, and an agent-loop integration test proves that the model chooses the tools and their order. Future account-dependent tools must reuse the same boundary. |
| H2  | Planned  | `maxToolTurns` limits model turns rather than the number of tool executions, so one turn can request an unbounded number of calls.         | Add and enforce a per-message tool-call budget before dispatch, including tests for oversized batches.                                                                                                                                                                                                                                                                                                                                           |
| H3  | Planned  | Write tools have no operation identity, idempotency rule, confirmation policy, or mutation audit contract.                                 | Define trusted request and tool-call identity, idempotent application-service behaviour, explicit-confirmation rules, and privacy-safe mutation auditing before write tools are enabled.                                                                                                                                                                                                                                                         |

## Medium priority

| ID  | Status          | Finding                                                                                                                              | Required outcome                                                                                                                                                                                  |
| --- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | Planned         | The design promises retained exceptions for logging, but `Agent.executeTools` currently catches and discards them.                   | Define one safe logging boundary for unexpected failures without logging arguments, results, or financial identifiers.                                                                            |
| M2  | Planned         | The design assigns tool-result serialization to `ModelClient`, while `Agent` currently serializes results into conversation history. | Select and document one serialization owner, then align contracts and tests.                                                                                                                      |
| M3  | Planned         | Tool definitions and runtime validation can drift because `inputSchema` is an unvalidated record and the schema library is deferred. | Select a schema-first validation approach or require conformance tests that prove the exposed schema and runtime validator agree.                                                                 |
| M4  | Design resolved | The proposed catalog includes capabilities whose application dependencies do not exist yet.                                          | The design now distinguishes the initially implemented account, balance, and transaction tools from the target catalog. Register additional tools only when their application dependencies exist. |
| M5  | Resolved        | Ownership between the agent contracts package and concrete tools package was not completely explicit.                                | `ToolRegistry`, `AgentTool`, shared result contracts, and `DefaultToolRegistry` live in the agent package. Concrete banking tools and their metadata live in the tools package.                   |

## Low priority

| ID  | Status          | Finding                                                                                                          | Required outcome                                                                                                        |
| --- | --------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| L1  | Planned         | `get_supported_capabilities` is described as dependency-free even though it must reflect the enabled registry.   | Derive capabilities from registered definitions or inject a read-only catalog without creating a registry cycle.        |
| L2  | Design resolved | Timezone is global orchestrator configuration and is not stored per user or session.                             | Global deployment configuration is intentional for this single-user application. Revisit only if product scope changes. |
| L3  | Planned         | Readonly TypeScript types do not prevent mutation of nested tool definitions or the `Date` in execution context. | Decide whether registry snapshots and immutable time representations are required, and test the chosen boundary.        |
| L4  | Planned         | `ToolResult` structurally allows oversized or accidentally sensitive data.                                       | Establish output projection and size rules for concrete tools, with tests for model-safe results.                       |

## Recommended order

1. H2: bounded tool-call execution.
2. H3: safe and idempotent write execution.
3. M1-M4: remaining contract alignment and implementation scope.
4. L1-L4: hardening before broader rollout.
