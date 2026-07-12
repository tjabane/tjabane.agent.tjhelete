# MVP Product Spec: WhatsApp Personal Banking Agent

## 1. Product Summary

A WhatsApp-based personal finance agent that helps the user understand spending, monitor balances, and track financial goals through natural conversation and proactive updates.

The agent acts as a private financial assistant. The user can ask questions like:

```text
How much did I spend today?
Am I still within my weekly budget?
Can I afford to spend R1,000 this weekend?
How close am I to my emergency fund goal?
```

The MVP focuses on financial awareness, spending control, and goal tracking. It does not move money or make payments.

## 2. Target User

The initial target user is one individual managing personal finances.

The user:

- Wants to interact through WhatsApp
- Wants quick answers about spending and balances
- Wants proactive warnings before overspending
- Wants help tracking financial goals
- Does not want to manually maintain spreadsheets
- Wants plain-language financial insights

## 3. Problem Statement

Banking apps show balances and transactions, but they usually do not help the user understand daily behavior, spending pace, or progress toward goals.

The user needs an assistant that can answer:

- How much have I spent today?
- How much have I spent this week?
- What am I spending money on?
- Am I still within my budget?
- Am I on track with my goals?
- Is there anything unusual I should know about?

## 4. MVP Goal

Build a WhatsApp agent that can:

- Answer spending and balance questions
- Track daily and weekly spending
- Categorize transactions into simple groups
- Track basic financial goals
- Send proactive summaries and alerts
- Help the user make better short-term spending decisions

## 5. Core User Experience

The user communicates with the agent in WhatsApp.

Example:

```text
User: How much did I spend today?

Agent: You've spent R612 today across 5 transactions. Your biggest spend was R340 at Checkers. Your daily target is R500, so you're R112 over.
```

The agent can also send proactive updates:

```text
Agent: Morning update: Your available balance is R18,420. You spent R735 yesterday. This week you've spent R2,140 of your R3,500 weekly target.
```

## 6. MVP Features

### 6.1 WhatsApp Conversation

The user can ask financial questions in plain language.

Supported questions include:

- What is my balance?
- How much did I spend today?
- How much did I spend this week?
- What did I spend money on today?
- What are my biggest expenses this week?
- Am I within budget?
- How am I doing on my savings goal?
- Show my latest transactions.
- What subscriptions came off this month?

The agent should respond in a short, specific, number-driven way.

### 6.2 Balance Awareness

The agent can tell the user their available balance and, where useful, explain when the information was last updated.

Example:

```text
Your available balance is R18,420. Last updated today at 08:15.
```

If there are multiple accounts, the agent should summarize them clearly.

Example:

```text
Main account: R12,300 available.
Credit card: R4,120 outstanding.
Savings: R22,000.
```

### 6.3 Daily Spend Tracking

The agent tracks how much the user has spent today.

It should show:

- Total spent today
- Number of transactions
- Biggest transaction
- Spend by category, where useful
- Remaining amount against daily target

Example:

```text
You've spent R420 today across 3 transactions: R280 groceries, R90 transport, and R50 coffee. Your daily target is R500, so you have R80 left for today.
```

### 6.4 Weekly Spend Tracking

The agent tracks spending for the current week.

Default week:

- Monday to Sunday

It should show:

- Total spent this week
- Weekly target
- Remaining amount for the week
- Spend by category
- Biggest expenses

Example:

```text
You've spent R2,850 this week. Your weekly target is R3,500, so you have R650 left until Sunday.
```

### 6.5 Transaction Categorization

The agent groups transactions into simple categories:

- Groceries
- Eating out
- Transport
- Fuel
- Subscriptions
- Shopping
- Rent or housing
- Utilities
- Health
- Bank fees
- Transfers
- Income
- Savings
- Unknown

The user can correct categories through WhatsApp.

Example:

```text
User: That Checkers transaction is groceries.

Agent: Got it. I'll treat Checkers as groceries going forward.
```

### 6.6 Budgets

The user can set simple daily and weekly spending targets.

Examples:

```text
Set my daily budget to R500.
Set my weekly budget to R3,500.
```

The agent uses these targets when answering spending questions and sending alerts.

Example:

```text
You have R650 left for the week, which is about R162 per day until Sunday.
```

### 6.7 Financial Goals

The user can define and track basic goals.

MVP goal types:

- Savings goal
- Spending limit goal

Example savings goal:

```text
Create a goal to save R10,000 by 31 December.
```

Agent response:

```text
Your emergency fund goal is R4,200 of R10,000 complete. You need to save about R725 per week to reach it by 31 December.
```

Example spending goal:

```text
Keep eating out under R1,500 this month.
```

Agent response:

```text
You've spent R920 on eating out this month. You have R580 left.
```

### 6.8 Proactive Summaries

The agent sends scheduled summaries.

Daily summary should include:

- Available balance
- Yesterday's spend
- Current weekly spend
- Budget status
- Goal status, if relevant

Example:

```text
Morning update:
Available balance: R18,420.
Spent yesterday: R735.
This week: R2,140 of R3,500.
Emergency fund: R450 behind pace.
```

Weekly summary should include:

- Total weekly spend
- Top categories
- Biggest transactions
- Budget result
- Goal progress

### 6.9 Alerts

The agent sends alerts when something important happens.

MVP alerts:

- Daily spend target exceeded
- Weekly spend target exceeded
- Low balance
- Large transaction
- Goal falling behind
- Subscription charged
- Bank fee detected

Example:

```text
Heads up: you've spent R540 today, which is R40 over your daily target.
```

Alerts should be useful and limited. The product should avoid sending too many messages.

## 7. MVP Commands

The agent should support common commands as shortcuts:

```text
balance
today
week
month
goals
latest transactions
set daily budget R500
set weekly budget R3500
create goal save R10000 by 31 Dec
categories
help
```

Natural language should also work.

Examples:

```text
Am I over budget?
What was my biggest transaction this week?
How much do I have left for the week?
Can I afford dinner tonight?
```

## 8. Agent Behavior

The agent should:

- Be concise
- Be clear with amounts and dates
- Use plain language
- Avoid judgmental language
- Be proactive only when useful
- Ask clarification questions when needed
- Mention when information may be stale
- Explain calculations when asked
- Avoid giving regulated financial advice

Good response:

```text
You spent R612 today across 5 transactions. R340 was groceries, R180 was fuel, and R92 was coffee/snacks. Your daily target is R500, so you're R112 over.
```

Bad response:

```text
You are bad with money and need to stop spending.
```

## 9. Privacy And Safety Principles

The product handles sensitive financial information, so the MVP must follow these product-level principles:

- The agent only monitors and explains finances
- The agent does not move money
- The agent does not make payments
- The agent does not change banking details
- The agent avoids unnecessary exposure of sensitive information
- The user should be able to stop alerts
- The user should be able to request deletion of their data
- The agent should be transparent when data is incomplete or outdated

## 10. Out Of Scope For MVP

Not included in the MVP:

- Automatic payments
- Money transfers
- Investment recommendations
- Credit score monitoring
- Multi-user household budgeting
- Full mobile app
- Complex forecasting
- Tax reporting
- Receipt scanning
- Voice notes
- Business banking
- Multi-bank support, unless simple to add

## 11. Success Criteria

The MVP is successful when the user can reliably use WhatsApp to:

- Ask for current balance
- Ask how much they spent today
- Ask how much they spent this week
- See spend by category
- Set daily and weekly budgets
- Create at least one financial goal
- Receive a useful daily summary
- Receive alerts before or soon after overspending
- Understand whether they are on track financially

Target quality:

- Daily and weekly spend answers are accurate
- Most common transactions are categorized correctly
- Alerts feel helpful, not noisy
- The user trusts the agent enough to check it daily

## 12. MVP Definition

The MVP is complete when the user can message the WhatsApp agent:

```text
How much did I spend today?
```

And receive an accurate answer based on their actual financial data.

The user should also be able to ask:

```text
Am I on track with my savings goal?
```

And receive a clear, useful answer based on their current progress.
