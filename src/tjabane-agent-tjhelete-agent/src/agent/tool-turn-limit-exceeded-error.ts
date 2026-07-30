export class ToolTurnLimitExceededError extends Error {
  public constructor(maxToolTurns: number) {
    super(`The model exceeded the limit of ${maxToolTurns} tool turns.`);
    this.name = "ToolTurnLimitExceededError";
  }
}
