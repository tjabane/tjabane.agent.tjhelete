export class DatabaseConcurrencyError extends Error {
  public constructor() {
    super("The record was changed by another operation.");
    this.name = "DatabaseConcurrencyError";
  }
}
