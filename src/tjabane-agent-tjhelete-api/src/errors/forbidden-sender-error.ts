export class ForbiddenSenderError extends Error {
  public constructor() {
    super("The sender is not authorised.");
    this.name = "ForbiddenSenderError";
  }
}
