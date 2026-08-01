import type { Static, TSchema } from "@sinclair/typebox";
import Ajv, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import { invalidArguments } from "../tool-errors.js";

const ajv = new Ajv({ allErrors: false, strict: true });
addFormats(ajv);

export function createArgumentValidator<T extends TSchema>(
  schema: T,
): (arguments_: unknown) => Static<T> {
  const validate = ajv.compile(schema);

  return (arguments_: unknown): Static<T> => {
    if (!validate(arguments_)) {
      throw invalidArguments(formatValidationError(validate.errors));
    }

    return arguments_ as Static<T>;
  };
}

function formatValidationError(errors: readonly ErrorObject[] | null | undefined): string {
  const error = errors?.[0];
  if (error === undefined) {
    return "Tool arguments do not match the published input schema.";
  }

  const location = error.instancePath === "" ? "" : ` at "${error.instancePath}"`;
  return `Tool arguments${location} ${error.message ?? "do not match the published input schema"}.`;
}
