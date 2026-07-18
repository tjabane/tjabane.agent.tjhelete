# Tech Spec: Agent Tjhelete

## 1. Summary

I want to build a personal finance agent that helps the user understand spending, monitor balances, and track financial goals through natural conversation and proactive updates.

## 2. Problem

It takes a effort to track my daily spending and my financial goals. I dont know how much money I spend yesterday or last week.

## 3. Goals

List what this project should achieve.

- Allow user agent communication to happen over whatsapp
- Allow user to get daily financial reports
- Allow user to get weekly financial reports
- Agent to should alert the user if they have over spend on that particular day

## 4. Non-Goals

List what you are intentionally not doing right now.

- No email service
- The agent will not be automous
- We are not adding the ability to feed transaction data from other banks outside investec
- We are not adding the ability to plan and track financial assests at this phase.

## 5. Users

Investec Bank account holders, at this phase

## 7. Requirements

### Functional Requirements

What must the system do?

- The login form must have email and password fields.
- The user must be able to submit the form.
- The system must validate the email and password.
- The system must show a success or error message.

### Non-Functional Requirements

How well should it work?

- Login should complete in under 2 seconds.
- Passwords must not be stored in plain text.
- The page should work on mobile and desktop.

## 8. Proposed Solution

Agent Tjhelete will sit between the user, WhatsApp, Investec account data, and an LLM provider. The user interacts with the agent through WhatsApp. The agent fetches financial data from Investec, reasons over that data, and sends conversational answers, daily reports, weekly reports, and overspending alerts back to the user.

![System Context Diagram](diagrams/context_diagram.svg)

Editable Excalidraw source: [agent_tjhelete_system_context.excalidraw](diagrams/agent_tjhelete_system_context.excalidraw)

### 8.1 Components

#### Twilio

Rather than integrationg with meta whatapp backed directly going throuugh twilio will be easier and the extra cost will be relatively small at the expected number of users

### Component Diagram

The component diagram expands the Agent Orchestrator container and shows the internal components responsible for routing messages, loading financial data, generating reports, detecting overspending, composing responses, and persisting state.

![Component Diagram](diagrams/component_diagram.svg)

## 10. Data Model

## 11. API Design

If your feature needs backend endpoints, describe them.

Example:

### POST /login

Request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}

Success response:

{
  "token": "abc123",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}

Error response:

{
  "error": "Invalid email or password"
}

## 12. Edge Cases
## 13. Security and Privacy
## 14. Testing Plan
## 15. Costing