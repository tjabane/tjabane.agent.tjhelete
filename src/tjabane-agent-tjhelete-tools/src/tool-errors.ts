export class ControlledToolError extends Error {
  public constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export function invalidArguments(message: string): ControlledToolError {
  return new ControlledToolError("invalid_arguments", message);
}
