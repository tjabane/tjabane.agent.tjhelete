# Tool Registry Design

This document finalises the initial design of the agent tool registry. It is a design document only; no tool registry or tools are implemented here.

## Design intent

The `ToolRegistry` is the controlled boundary between a model's tool request and application capabilities. It has three responsibilities:

1. Provide the approved tool definitions to the model client.
2. Find a tool by its exact approved name.
3. Dispatch that tool with trusted execution context and untrusted model arguments.

The registry does not contain banking calculations, call bank APIs, or implement individual tools. A concrete tool owns its schema validation and calls its application dependencies.

## Core contracts

The tool-definition contract stays independent of a model provider. A `ModelClient` translates it to the SDK-specific function/tool format.

```ts
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchema;
}

export interface AgentTool {
  readonly definition: ToolDefinition;

  execute(
    context: ToolExecutionContext,
    arguments_: unknown,
  ): Promise<ToolResult>;
}

export interface ToolRegistry {
  getDefinitions(): readonly ToolDefinition[];
  execute(
    toolName: string,
    context: ToolExecutionContext,
    arguments_: unknown,
  ): Promise<ToolResult>;
}
```

`JsonSchema` represents the project’s chosen JSON Schema type. The exact library is deliberately deferred; the schema must be usable both to describe the model contract and validate the incoming arguments.

## Execution context

The model supplies only tool arguments. The application supplies the execution context after authenticating the inbound message.

```ts
export interface ToolExecutionContext {
  userId: string;
  sessionId: string;
  timezone: string;
  now: Date;
}
```

This prevents a model request from selecting another user's account or changing the clock used for financial calculations. Individual tools use `userId` to retrieve only data the current user is allowed to access.

## Tool result

A tool returns compact, model-safe structured data. The model client is responsible for serialising it in the provider's required tool-result format.

```ts
export interface ToolResult {
  data: Record<string, unknown>;
}
```

Tool results must contain only information needed to answer the user. They must not include credentials, raw HTTP responses, account numbers, or internal implementation errors.

## Registry behaviour

`DefaultToolRegistry` is constructed with the complete, explicit tool list. It stores the tools by name and fails fast if two tools claim the same name.

```ts
export class DefaultToolRegistry implements ToolRegistry {
  public constructor(private readonly tools: readonly AgentTool[]) {}

  public getDefinitions(): readonly ToolDefinition[] {
    throw new Error("Not implemented");
  }

  public async execute(
    toolName: string,
    context: ToolExecutionContext,
    arguments_: unknown,
  ): Promise<ToolResult> {
    throw new Error("Not implemented");
  }
}
```

The intended behaviour is:

- Unknown name: return a controlled `unknown_tool` failure to the agent loop; do not dynamically import or invoke anything.
- Duplicate name at construction: fail application startup.
- Invalid arguments: the selected tool returns a controlled `invalid_arguments` failure explaining only the correction the model needs.
- Application or provider failure: the selected tool translates it into a safe, user-appropriate failure. The underlying exception remains available to application logging, not the model.

## Tool ownership

The registry dispatches by name only. Each tool has a narrow responsibility:

| Tool | Effect | Application dependency | Purpose |
| --- | --- | --- | --- |
| `get_account_balances` | Read | banking query capability | Return labelled balances and freshness. |
| `get_spending_summary` | Read | transaction query, budget query | Summarise a selected period, including categories and budget comparison when requested. |
| `list_transactions` | Read | transaction query | Return a short, filtered list of transactions. |
| `get_budget_status` | Read | budget query, transaction query | Return budget remaining or exceeded for daily or weekly periods. |
| `set_budget` | Write | budget service | Set a daily or weekly spending target. |
| `list_goals` | Read | goal query | Return goal progress and pace. |
| `create_goal` | Write | goal service | Create a savings or category-spend goal. |
| `update_transaction_category` | Write | transaction categorisation service | Correct one transaction; only apply a future merchant rule when explicitly requested. |
| `update_notification_preferences` | Write | notification-preference service | Start or stop summaries and alerts. |
| `get_supported_capabilities` | Read | none | Return concise help based on the enabled tool set. |

No tool is defined for payments, transfers, banking-detail changes, or investment recommendations. They are outside the product boundary.

## Metadata ownership

Tool metadata belongs to the agent tool, not the services module.

```ts
export const getSpendingSummaryDefinition: ToolDefinition = {
  name: "get_spending_summary",
  description:
    "Get a user's spending totals, category breakdown, largest transaction, and budget comparison for a requested period.",
  inputSchema: {
    type: "object",
    properties: {
      period: {
        enum: ["today", "this_week", "this_month", "custom"],
      },
      startDate: { type: "string" },
      endDate: { type: "string" },
      includeCategories: { type: "boolean" },
      includeLargestTransaction: { type: "boolean" },
      includeBudgetComparison: { type: "boolean" },
    },
    required: ["period"],
    additionalProperties: false,
  },
};
```

This metadata communicates what the model may ask for. The services module instead owns provider metadata such as endpoint paths, headers, rate limits, and raw response DTOs.

## Class diagram

```mermaid
classDiagram
    class ToolRegistry {
        <<interface>>
        +getDefinitions() readonly ToolDefinition[]
        +execute(toolName, context, arguments) Promise~ToolResult~
    }

    class DefaultToolRegistry {
        -tools: Map~string, AgentTool~
        +getDefinitions() readonly ToolDefinition[]
        +execute(toolName, context, arguments) Promise~ToolResult~
    }

    class AgentTool {
        <<interface>>
        +definition: ToolDefinition
        +execute(context, arguments) Promise~ToolResult~
    }

    class ToolDefinition {
        +name: string
        +description: string
        +inputSchema: JsonSchema
    }

    class ToolExecutionContext {
        +userId: string
        +sessionId: string
        +timezone: string
        +now: Date
    }

    class ToolResult {
        +data: Record~string, unknown~
    }

    class GetSpendingSummaryTool {
        -transactionQueries: TransactionQueryService
        -budgetQueries: BudgetQueryService
        +definition: ToolDefinition
        +execute(context, arguments) Promise~ToolResult~
    }

    DefaultToolRegistry ..|> ToolRegistry : implements
    GetSpendingSummaryTool ..|> AgentTool : implements
    DefaultToolRegistry o--> AgentTool : registers
    AgentTool --> ToolDefinition : exposes
    AgentTool --> ToolExecutionContext : receives
    AgentTool --> ToolResult : returns
```

## Message sequence

```mermaid
sequenceDiagram
    participant A as Agent
    participant R as ToolRegistry
    participant T as Selected AgentTool
    participant S as Application service

    A->>R: execute(toolName, context, raw arguments)
    R->>R: find exact approved name
    R->>T: execute(context, raw arguments)
    T->>T: validate arguments against its schema
    T->>S: perform narrow application action
    S-->>T: application result
    T-->>R: model-safe ToolResult
    R-->>A: ToolResult
```

## Composition and dependency direction

The API/application composition root creates the concrete services and injects them into the required tools. It then gives the complete tool list to the registry and injects the registry into `AgentFactory`.

```text
API composition root
  -> InvestecBankApiClient / application services
  -> concrete AgentTool instances
  -> DefaultToolRegistry
  -> AgentFactory

Agent -> ToolRegistry -> AgentTool -> application capability -> services adapter
```

`Agent` does not import concrete tools or service clients. `ToolRegistry` does not import banking APIs. Each concrete tool depends only on the narrow application capability it needs.

## Decisions

- The registry has no dynamic tool loading; its complete tool set is explicit at application startup.
- The registry routes by exact name and controls unknown-tool behaviour.
- Concrete tools validate their own arguments and own their tool-specific failure translation.
- Tool definitions are provider-neutral and belong in the agent module.
- Tool results are compact, structured, and safe for the model to see.
- Identity, session, time, and timezone come from trusted execution context, never from tool arguments.
- Financial data tools may read, analyse, and update the application's own preferences/goals/categories; they may never move money.

## Deferred decisions

- The JSON Schema validation library and precise `JsonSchema` type.
- Exact application contracts for budgets, goals, categorisation, and notifications.
- Whether tool execution is wrapped in telemetry/auditing middleware.
- The provider-specific conversion performed by `ModelClient`.
