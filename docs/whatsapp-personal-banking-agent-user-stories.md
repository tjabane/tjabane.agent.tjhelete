# User Stories: WhatsApp Personal Banking Agent

## 1. Setup And Onboarding

### Story 1.1: Activate WhatsApp Agent

As a user, I want to activate the personal banking agent on WhatsApp so that I can start managing my finances through chat.

Acceptance criteria:

- The user can start a conversation with the agent on WhatsApp.
- The agent introduces what it can help with.
- The agent explains that it monitors and explains finances only.
- The agent explains that it cannot move money or make payments.

### Story 1.2: Set Daily Budget

As a user, I want to set a daily spending budget so that the agent can tell me whether I am over or under my daily target.

Acceptance criteria:

- The user can set a daily budget using natural language.
- The user can set a daily budget using a shortcut command.
- The agent confirms the budget amount.
- Future daily spend responses use the configured daily budget.

### Story 1.3: Set Weekly Budget

As a user, I want to set a weekly spending budget so that the agent can help me manage spending across the week.

Acceptance criteria:

- The user can set a weekly budget using natural language.
- The user can set a weekly budget using a shortcut command.
- The agent confirms the budget amount.
- Future weekly spend responses use the configured weekly budget.

### Story 1.4: View Help

As a user, I want to ask for help so that I know what commands and questions the agent supports.

Acceptance criteria:

- The user can send `help`.
- The agent returns a concise list of supported commands.
- The help response includes balance, today, week, goals, latest transactions, and budget examples.

## 2. Balance Awareness

### Story 2.1: Ask For Balance

As a user, I want to ask for my current balance so that I know how much money I have available.

Acceptance criteria:

- The user can ask for balance in natural language.
- The agent returns the available balance where possible.
- The agent includes the last updated time when relevant.
- The response is concise and easy to understand.

### Story 2.2: View Multiple Account Balances

As a user, I want to see balances across my accounts so that I understand my overall financial position.

Acceptance criteria:

- The agent can show balances for multiple accounts.
- Each account has a clear label.
- Credit, savings, and main account balances are distinguishable.
- The agent avoids exposing unnecessary sensitive account details.

## 3. Daily Spend Tracking

### Story 3.1: Ask For Today's Spend

As a user, I want to ask how much I spent today so that I can manage my daily spending.

Acceptance criteria:

- The user can ask for today's spend in natural language.
- The user can use the `today` shortcut.
- The agent returns total spend for the current day.
- The agent returns the number of transactions included.
- The agent compares spend against the daily budget when one exists.

### Story 3.2: See Remaining Daily Budget

As a user, I want to know how much of my daily budget remains so that I can make better spending decisions for the rest of the day.

Acceptance criteria:

- The agent calculates the remaining daily budget.
- If the user is under budget, the agent shows the amount left.
- If the user is over budget, the agent shows the amount exceeded.
- The response uses clear currency values.

### Story 3.3: See Biggest Daily Transaction

As a user, I want to see my biggest transaction today so that I understand what drove my spending.

Acceptance criteria:

- The agent identifies the largest transaction for the current day.
- The response includes merchant or description where available.
- The response includes the transaction amount.

## 4. Weekly Spend Tracking

### Story 4.1: Ask For Weekly Spend

As a user, I want to ask how much I spent this week so that I can stay within my weekly budget.

Acceptance criteria:

- The user can ask for weekly spend in natural language.
- The user can use the `week` shortcut.
- The agent calculates spend from Monday to Sunday by default.
- The agent compares spend against the weekly budget when one exists.

### Story 4.2: See Remaining Weekly Budget

As a user, I want to know how much money I have left for the week so that I can pace my spending.

Acceptance criteria:

- The agent calculates the remaining weekly budget.
- The agent states how much remains until Sunday.
- If the budget is exceeded, the agent states by how much.
- The agent may include a simple daily pace amount for the rest of the week.

### Story 4.3: See Weekly Category Breakdown

As a user, I want to see what I spent money on this week so that I understand where my money is going.

Acceptance criteria:

- The user can ask for a weekly category breakdown.
- The agent groups weekly spend by category.
- The response includes category names and amounts.
- The response is concise enough for WhatsApp.

## 5. Transaction Understanding

### Story 5.1: View Latest Transactions

As a user, I want to see my latest transactions so that I can quickly review recent activity.

Acceptance criteria:

- The user can ask for latest transactions.
- The agent returns a short list of recent transactions.
- Each transaction includes merchant or description, amount, and category where available.
- The response avoids unnecessary sensitive details.

### Story 5.2: Categorize Transactions

As a user, I want my transactions categorized so that I can understand my spending without sorting transactions manually.

Acceptance criteria:

- Transactions are assigned to simple spending categories.
- Unknown transactions can be marked as unknown.
- Category names are understandable to the user.
- Categorization supports daily and weekly spend summaries.

### Story 5.3: Correct Transaction Category

As a user, I want to correct a transaction category so that the agent becomes more accurate over time.

Acceptance criteria:

- The user can correct a category through WhatsApp.
- The agent confirms the correction.
- Future similar transactions use the corrected category where appropriate.

## 6. Budget Management

### Story 6.1: Change Daily Budget

As a user, I want to change my daily budget so that the agent reflects my current spending target.

Acceptance criteria:

- The user can update the daily budget through WhatsApp.
- The agent confirms the new amount.
- Future daily spend calculations use the updated amount.

### Story 6.2: Change Weekly Budget

As a user, I want to change my weekly budget so that the agent reflects my current weekly spending target.

Acceptance criteria:

- The user can update the weekly budget through WhatsApp.
- The agent confirms the new amount.
- Future weekly spend calculations use the updated amount.

### Story 6.3: Ask If Over Budget

As a user, I want to ask whether I am over budget so that I can quickly understand my spending status.

Acceptance criteria:

- The user can ask whether they are over budget.
- The agent clarifies daily or weekly budget if needed.
- The agent states whether the user is over or under budget.
- The agent includes the relevant amount.

## 7. Financial Goals

### Story 7.1: Create Savings Goal

As a user, I want to create a savings goal so that I can track progress toward a target amount.

Acceptance criteria:

- The user can create a savings goal through WhatsApp.
- The goal includes a target amount.
- The goal can include a deadline.
- The agent confirms the goal after creation.

### Story 7.2: Create Spending Limit Goal

As a user, I want to create a spending limit goal so that I can control spending in a specific category.

Acceptance criteria:

- The user can create a category spending limit through WhatsApp.
- The goal includes a category and limit amount.
- The goal includes a period where relevant.
- The agent confirms the goal after creation.

### Story 7.3: Check Goal Progress

As a user, I want to ask about my goal progress so that I know whether I am on track.

Acceptance criteria:

- The user can ask for goal progress.
- The agent returns current progress.
- The agent shows the remaining amount.
- The agent explains required pace when a deadline exists.

### Story 7.4: Warn When Goal Is Behind

As a user, I want the agent to warn me when I am behind on a goal so that I can adjust my behavior early.

Acceptance criteria:

- The agent can identify when a goal is behind pace.
- The alert includes the goal name.
- The alert includes the gap or required pace.
- The alert uses a neutral, non-judgmental tone.

## 8. Proactive Summaries

### Story 8.1: Receive Daily Summary

As a user, I want to receive a daily financial summary so that I stay aware without needing to ask.

Acceptance criteria:

- The agent sends a daily summary.
- The summary includes available balance.
- The summary includes recent spend.
- The summary includes weekly budget status.
- The summary includes goal status when relevant.

### Story 8.2: Receive Weekly Summary

As a user, I want to receive a weekly summary so that I can review how I spent money during the week.

Acceptance criteria:

- The agent sends a weekly summary.
- The summary includes total weekly spend.
- The summary includes top categories.
- The summary includes budget result.
- The summary includes goal progress where relevant.

### Story 8.3: Stop Summaries

As a user, I want to stop proactive summaries so that I control how often the agent messages me.

Acceptance criteria:

- The user can ask the agent to stop summaries.
- The agent confirms summaries are stopped.
- The agent does not continue sending stopped summary messages.

## 9. Alerts

### Story 9.1: Daily Budget Alert

As a user, I want to receive an alert when I exceed my daily budget so that I know I should slow down spending.

Acceptance criteria:

- The agent detects when daily spend exceeds the daily budget.
- The alert includes total daily spend.
- The alert includes the amount over budget.
- The alert is concise.

### Story 9.2: Weekly Budget Alert

As a user, I want to receive an alert when I exceed my weekly budget so that I can adjust for the rest of the week.

Acceptance criteria:

- The agent detects when weekly spend exceeds the weekly budget.
- The alert includes total weekly spend.
- The alert includes the amount over budget.
- The alert is concise.

### Story 9.3: Low Balance Alert

As a user, I want to receive a low balance alert so that I can avoid running out of available money.

Acceptance criteria:

- The agent can identify a low balance condition.
- The alert includes the relevant balance.
- The alert avoids exposing unnecessary account details.

### Story 9.4: Large Transaction Alert

As a user, I want to receive an alert for a large transaction so that I can quickly spot unusual or important spending.

Acceptance criteria:

- The agent can identify a large transaction.
- The alert includes merchant or description where available.
- The alert includes the transaction amount.
- The alert is sent only when the transaction is significant.

### Story 9.5: Subscription Alert

As a user, I want to be notified when a subscription is charged so that I stay aware of recurring expenses.

Acceptance criteria:

- The agent can identify subscription-like transactions.
- The alert includes the merchant and amount.
- The alert is concise.

### Story 9.6: Bank Fee Alert

As a user, I want to be notified when a bank fee is charged so that I understand avoidable account costs.

Acceptance criteria:

- The agent can identify bank fee transactions.
- The alert includes the fee amount.
- The alert includes the transaction description where useful.

## 10. Conversation Recovery

### Story 10.1: Clarify Ambiguous Requests

As a user, I want the agent to ask a clarification question when my request is unclear so that I can continue naturally.

Acceptance criteria:

- The agent detects unclear intent.
- The agent asks a specific clarification question.
- The clarification offers likely options.
- The user can answer without restarting the conversation.

### Story 10.2: Handle Missing Budget

As a user, I want the agent to explain when no budget is set so that I know how to configure one.

Acceptance criteria:

- If no daily budget exists, the agent says so when needed.
- If no weekly budget exists, the agent says so when needed.
- The agent gives an example command for setting the missing budget.

### Story 10.3: Handle Missing Goal

As a user, I want the agent to explain when no goals exist so that I know how to create one.

Acceptance criteria:

- If no goals exist, the agent says so.
- The agent gives an example command for creating a goal.

### Story 10.4: Handle Out-Of-Scope Advice

As a user, I want the agent to avoid unsupported financial advice so that I am not misled.

Acceptance criteria:

- The agent declines investment recommendations.
- The agent declines payment or money movement requests.
- The agent redirects the user to supported finance monitoring tasks.

## 11. Privacy And Control

### Story 11.1: Stop Alerts

As a user, I want to stop alerts so that I control how often the agent messages me.

Acceptance criteria:

- The user can ask to stop alerts.
- The agent confirms alerts are stopped.
- The agent stops sending non-critical alerts.

### Story 11.2: Request Data Deletion

As a user, I want to request deletion of my data so that I remain in control of my financial information.

Acceptance criteria:

- The user can request data deletion.
- The agent acknowledges the request.
- The agent explains what will happen next in plain language.

### Story 11.3: Handle Stale Data

As a user, I want the agent to tell me when financial data is outdated so that I do not make decisions on stale information.

Acceptance criteria:

- The agent identifies when data is stale.
- The agent includes the last updated time.
- The agent clearly states that newer transactions may be missing.

## 12. MVP Priority

### Must Have

- Activate WhatsApp agent
- Set daily budget
- Set weekly budget
- Ask for balance
- Ask for today's spend
- Ask for weekly spend
- See latest transactions
- Categorize transactions
- Correct transaction categories
- Create savings goal
- Check goal progress
- Receive daily summary
- Receive daily budget alert
- View help

### Should Have

- Weekly summary
- Spending limit goals
- Weekly budget alert
- Low balance alert
- Large transaction alert
- Subscription alert
- Bank fee alert
- Stop summaries
- Stop alerts
- Handle stale data

### Could Have

- Multiple account balance summary
- Daily pace guidance
- Goal behind-pace alerts
- More advanced category breakdowns
- More flexible natural language recovery

### Out Of Scope For MVP

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
