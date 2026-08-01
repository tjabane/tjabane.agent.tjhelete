import type { ToolResult } from "@tjabane-agent-tjhelete/agent";
import type { BankAccount, BankApiClient } from "@tjabane-agent-tjhelete/services";
import { ControlledToolError, invalidArguments } from "../tool-errors.js";

export async function executeBankingAction(
  action: () => Promise<Readonly<Record<string, unknown>>>,
): Promise<ToolResult> {
  try {
    return { ok: true, data: await action() };
  } catch (error) {
    if (error instanceof ControlledToolError) {
      return {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          retryable: false,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: "banking_unavailable",
        message: "Banking information is temporarily unavailable.",
        retryable: true,
      },
    };
  }
}

export function normalizeAccountReferences(
  value: readonly string[] | undefined,
): readonly string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  const references = value.map((reference) => reference.trim());

  if (new Set(references.map(normalizeReference)).size !== references.length) {
    throw invalidArguments("accountReferences must not contain duplicates.");
  }

  return references;
}

export async function resolveAccounts(
  bankApiClient: BankApiClient,
  references: readonly string[] | undefined,
): Promise<readonly BankAccount[]> {
  const accounts = await bankApiClient.getAccounts();

  if (references === undefined) {
    return accounts;
  }

  return references.map((reference) => {
    const normalizedReference = normalizeReference(reference);
    const matches = accounts.filter(
      (account) => normalizeReference(account.referenceName) === normalizedReference,
    );

    if (matches.length === 0) {
      throw new ControlledToolError(
        "account_not_found",
        `No authorised account matches the reference "${reference}".`,
      );
    }

    if (matches.length > 1) {
      throw new ControlledToolError(
        "ambiguous_account_reference",
        `More than one authorised account matches the reference "${reference}".`,
      );
    }

    return matches[0]!;
  });
}

export function normalizeOptionalString(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value.trim();
}

function normalizeReference(value: string): string {
  return value.trim().toLocaleLowerCase("en-ZA");
}
