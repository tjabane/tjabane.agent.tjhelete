export class SessionNotFoundError extends Error {
  public constructor(sessionId: string) {
    super(`Session "${sessionId}" was not found.`);
    this.name = "SessionNotFoundError";
  }
}
