# User Story Journey: WhatsApp Personal Banking Agent

## 1. Primary User

The primary user is an individual who wants to manage personal spending and financial goals through WhatsApp.

They want fast, plain-language answers without opening a banking app, updating spreadsheets, or manually calculating budgets.

## 2. User Journey Overview

The user journey has five main stages:

1. Setup
2. First financial check-in
3. Daily spend monitoring
4. Weekly budget awareness
5. Goal tracking and proactive support

## 3. Journey Stage 1: Setup

### User Goal

The user wants to activate the agent and configure basic financial preferences.

### User Story

As a user, I want to set up my personal banking agent on WhatsApp so that I can start asking questions about my money from a familiar chat interface.

### Example Conversation

```text
Agent: Welcome. I can help you monitor spending, budgets, balances, and financial goals.

Agent: What daily spending target should I use?

User: R500

Agent: Got it. Your daily spending target is R500.

Agent: What weekly spending target should I use?

User: R3500

Agent: Got it. Your weekly spending target is R3,500.
```

### User Needs

- Simple onboarding
- Clear explanation of what the agent can and cannot do
- Confidence that the agent will not move money
- Ability to set daily and weekly budgets
- Ability to create an initial financial goal

### Acceptance Criteria

- The user can activate the agent through WhatsApp.
- The user can set a daily budget.
- The user can set a weekly budget.
- The user can create at least one financial goal.
- The agent clearly explains that it only monitors and explains finances.

## 4. Journey Stage 2: First Financial Check-In

### User Goal

The user wants to know their current financial position.

### User Story

As a user, I want to ask the agent for my balance so that I can quickly understand how much money I have available.

### Example Conversation

```text
User: What is my balance?

Agent: Your available balance is R18,420. Last updated today at 08:15.
```

If multiple accounts are available:

```text
Agent: Main account: R12,300 available.
Credit card: R4,120 outstanding.
Savings: R22,000.
Last updated today at 08:15.
```

### User Needs

- Fast balance visibility
- Clear account labels
- Last updated time
- No unnecessary detail unless requested

### Acceptance Criteria

- The user can ask for their balance in natural language.
- The agent responds with available balance where possible.
- The agent includes last updated information when relevant.
- The agent handles multiple accounts clearly.

## 5. Journey Stage 3: Daily Spend Monitoring

### User Goal

The user wants to know how much they have spent today and whether they are still within budget.

### User Story

As a user, I want to ask how much I have spent today so that I can control my spending before the day gets away from me.

### Example Conversation

```text
User: How much did I spend today?

Agent: You've spent R612 today across 5 transactions. Your biggest spend was R340 at Checkers. Your daily target is R500, so you're R112 over.
```

When the user is under budget:

```text
User: Today?

Agent: You've spent R420 today across 3 transactions. Your daily target is R500, so you have R80 left.
```

### User Needs

- Total daily spend
- Number of transactions
- Biggest transaction
- Budget comparison
- Short explanation of whether they are over or under budget

### Acceptance Criteria

- The user can ask for daily spend using natural language or shortcuts.
- The agent calculates spend for the current day.
- The agent compares spend against the daily budget.
- The agent highlights the biggest transaction when useful.
- The response is concise and easy to act on.

## 6. Journey Stage 4: Weekly Budget Awareness

### User Goal

The user wants to understand weekly spending pace and avoid running out of budget before the week ends.

### User Story

As a user, I want to ask how much I have spent this week so that I can adjust my spending for the rest of the week.

### Example Conversation

```text
User: How much have I spent this week?

Agent: You've spent R2,850 this week. Your weekly target is R3,500, so you have R650 left until Sunday.
```

With category breakdown:

```text
User: What did I spend money on this week?

Agent: This week: groceries R890, eating out R520, transport R430, subscriptions R299, shopping R711.
```

### User Needs

- Weekly spend total
- Remaining weekly budget
- Spend by category
- Biggest expenses
- Simple pacing guidance

### Acceptance Criteria

- The user can ask for weekly spend.
- The agent uses Monday to Sunday as the default week.
- The agent compares weekly spend against the weekly target.
- The agent can break down weekly spend by category.
- The agent can tell the user how much remains for the week.

## 7. Journey Stage 5: Transaction Understanding

### User Goal

The user wants to understand what specific transactions mean and correct the agent when a category is wrong.

### User Story

As a user, I want the agent to categorize my transactions so that I can understand my spending without manually sorting every transaction.

### Example Conversation

```text
User: Show my latest transactions.

Agent: Latest transactions:
1. Checkers, R340, groceries
2. Uber, R95, transport
3. Netflix, R199, subscriptions
```

Correction flow:

```text
User: That Checkers transaction is groceries.

Agent: Got it. I'll treat Checkers as groceries going forward.
```

### User Needs

- Latest transactions on request
- Clear merchant names
- Categories that are understandable
- Ability to correct mistakes
- Agent remembers corrections

### Acceptance Criteria

- The user can request latest transactions.
- Transactions include merchant, amount, and category.
- The user can correct a transaction category in WhatsApp.
- Future similar transactions use the corrected category.

## 8. Journey Stage 6: Budget Setup And Adjustment

### User Goal

The user wants to set or change spending limits as their financial situation changes.

### User Story

As a user, I want to update my daily and weekly budgets through WhatsApp so that the agent tracks spending against the limits I care about.

### Example Conversation

```text
User: Set my daily budget to R500.

Agent: Done. Your daily budget is now R500.
```

```text
User: Change my weekly budget to R4,000.

Agent: Done. Your weekly budget is now R4,000.
```

### User Needs

- Easy budget creation
- Easy budget changes
- Confirmation after changes
- Agent uses updated budgets immediately

### Acceptance Criteria

- The user can set a daily budget.
- The user can set a weekly budget.
- The user can change existing budgets.
- The agent confirms the updated amount.
- Future spend responses use the latest budget values.

## 9. Journey Stage 7: Financial Goal Tracking

### User Goal

The user wants to know whether they are making progress toward a savings or spending goal.

### User Story

As a user, I want to create and track a savings goal so that I can stay aware of whether I am on pace.

### Example Conversation

```text
User: Create a goal to save R10,000 by 31 December.

Agent: Goal created: save R10,000 by 31 December.
```

Progress check:

```text
User: Am I on track with my savings goal?

Agent: Your emergency fund goal is R4,200 of R10,000 complete. You need to save about R725 per week to reach it by 31 December.
```

Spending limit goal:

```text
User: Keep eating out under R1,500 this month.

Agent: Goal created: keep eating out under R1,500 this month.
```

```text
User: How am I doing on eating out?

Agent: You've spent R920 on eating out this month. You have R580 left.
```

### User Needs

- Create goals through natural language
- Track progress
- Understand remaining amount
- Understand required pace
- Receive warnings when falling behind

### Acceptance Criteria

- The user can create a savings goal.
- The user can create a spending limit goal.
- The user can ask for goal progress.
- The agent explains current progress and required pace.
- The agent warns when the user is falling behind.

## 10. Journey Stage 8: Proactive Daily Summary

### User Goal

The user wants a daily financial check-in without needing to ask.

### User Story

As a user, I want to receive a daily WhatsApp summary so that I start the day with a clear view of my spending and budget position.

### Example Message

```text
Morning update:
Available balance: R18,420.
Spent yesterday: R735.
This week: R2,140 of R3,500.
Emergency fund: R450 behind pace.
```

### User Needs

- Useful daily summary
- No unnecessary detail
- Budget status
- Goal status when relevant
- Ability to stop or adjust summaries

### Acceptance Criteria

- The agent can send a daily summary.
- The summary includes balance, recent spend, weekly budget status, and goal status.
- The message is concise.
- The user can stop daily summaries.

## 11. Journey Stage 9: Alerts And Warnings

### User Goal

The user wants to be warned about important financial events before they become problems.

### User Story

As a user, I want the agent to alert me when I exceed a budget or when something unusual happens so that I can respond quickly.

### Example Alerts

```text
Heads up: you've spent R540 today, which is R40 over your daily target.
```

```text
Large transaction detected: R2,300 at Takealot today.
```

```text
Your emergency fund goal is behind pace. You need about R725 per week, but saved R400 this week.
```

### User Needs

- Important alerts only
- Clear reason for the alert
- Specific amounts
- No judgmental tone
- Ability to reduce or stop alerts

### Acceptance Criteria

- The agent sends an alert when the daily budget is exceeded.
- The agent sends an alert when the weekly budget is exceeded.
- The agent can alert on low balance, large transactions, subscriptions, bank fees, and goals falling behind.
- Alerts include enough detail to understand why they were sent.
- Alerts are limited to avoid becoming noisy.

## 12. Journey Stage 10: Help And Recovery

### User Goal

The user wants to know what they can ask and recover when the agent misunderstands.

### User Story

As a user, I want to ask for help so that I know what the agent can do.

### Example Conversation

```text
User: Help

Agent: You can ask:
- balance
- today
- week
- goals
- latest transactions
- set daily budget R500
- create goal save R10000 by 31 Dec
```

When the agent is unsure:

```text
User: How am I doing?

Agent: Do you mean your daily spend, weekly budget, or savings goal?
```

### User Needs

- Simple help menu
- Clarification when the agent is unsure
- No dead ends
- Ability to rephrase naturally

### Acceptance Criteria

- The user can send `help` to see supported commands.
- The agent asks a clarification question when intent is unclear.
- The user can recover from misunderstandings without restarting.

## 13. Core User Stories Summary

### Balance

As a user, I want to ask for my balance so that I know how much money I have available.

### Daily Spend

As a user, I want to ask how much I spent today so that I can manage my daily spending.

### Weekly Spend

As a user, I want to ask how much I spent this week so that I can stay within my weekly budget.

### Category Breakdown

As a user, I want to see spending by category so that I understand where my money is going.

### Budget Management

As a user, I want to set daily and weekly budgets so that the agent can tell me whether I am over or under target.

### Goal Tracking

As a user, I want to create financial goals so that I can track progress over time.

### Proactive Summary

As a user, I want to receive daily summaries so that I stay aware without needing to ask.

### Alerts

As a user, I want important alerts so that I can respond to overspending, low balances, or goal risks.

### Corrections

As a user, I want to correct transaction categories so that the agent becomes more accurate over time.

## 14. Happy Path Journey

```text
1. User activates the WhatsApp agent.
2. Agent explains what it can do.
3. User sets daily and weekly budgets.
4. User creates a savings goal.
5. User asks for their current balance.
6. User asks how much they spent today.
7. Agent replies with spend total and budget status.
8. Agent sends a daily summary the next morning.
9. User receives an alert after exceeding daily budget.
10. User asks whether they are on track with their savings goal.
11. Agent replies with progress and required pace.
```

## 15. Edge Cases

### Data Is Outdated

```text
Agent: Your last update was yesterday at 18:10, so newer transactions may be missing. Based on available data, you've spent R1,240 this week.
```

### Unknown Transaction Category

```text
Agent: I found one uncategorized transaction: R220 at ABC Store. What category should I use?
```

### User Has No Budget Set

```text
Agent: You've spent R420 today. You do not have a daily budget set yet. Send "set daily budget R500" to add one.
```

### User Has No Goal Set

```text
Agent: You do not have any goals yet. You can say "create goal save R10000 by 31 Dec."
```

### User Asks For Advice Beyond Scope

```text
User: What shares should I buy?

Agent: I can't give investment recommendations. I can help you understand your spending, budget, balances, and savings goals.
```

## 16. MVP Journey Completion Criteria

The user journey is complete for MVP when the user can:

- Complete setup through WhatsApp
- Ask for balance
- Ask for daily spend
- Ask for weekly spend
- See spending by category
- Set and update budgets
- Create and check goals
- Receive a daily summary
- Receive useful budget or goal alerts
- Correct transaction categories
- Ask for help when unsure what to do
