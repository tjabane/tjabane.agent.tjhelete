export class SessionNotFoundError extends Error {
  public constructor(sessionId: string) {
    super(`Session "${sessionId}" was not found.`);
    this.name = "SessionNotFoundError";
  }
}

export class ToolTurnLimitExceededError extends Error {
  public constructor(maxToolTurns: number) {
    super(`The model exceeded the limit of ${maxToolTurns} tool turns.`);
    this.name = "ToolTurnLimitExceededError";
  }
}
