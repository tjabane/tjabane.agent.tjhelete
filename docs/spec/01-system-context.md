# System Overview

## 1 system Overview

A personal banker agent that will actively monitor your spenditure and help keep track of financial goals. Communication with the agent will be done over whatapp and it will use transation history and statements to track the money. The agent can schedule reports daily, weekly and monthly, it will also alert the user when they are going beyond their daily spend allowance.

```mermaid
flowchart LR
    User[User]
    System[Agent Tjhelete]
    Bank[Investec API]
    LLM[LLM Provider]
    Database[Database]

    User -->|Asks About Money| System
    System -->|Reads Transations| Bank
    System -->|Reasoning| LLM
    System -->|Saves convesation history| Database
```

## 2 Container Architecture

```mermaid
flowchart LR
    User[User]

    WhatsApp[Twilio]
    API[Backend API]
    AI[Diagnostic Engine]
    DB[(System Database)]
    Telemetry[Monitoring Platform]
    TransactionsAPI[Transactions API]

    User --> WhatsApp
    WhatsApp -->|HTTPS / JSON| API
    API --> DB
    API --> AI
    API --> Telemetry
    API --> |HTTPS / JSON| TransactionsAPI
```

### 2.1 Twilio

### 2.2 Backend API

