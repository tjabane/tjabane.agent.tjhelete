export interface AppConfig {
  readonly nodeEnv: string;
  readonly port: number;
  readonly timezone: string;
  readonly maxToolTurns: number;
  readonly systemPrompt: string;
  readonly twilio: {
    readonly publicWebhookUrl: URL;
    readonly authToken: string;
    readonly allowedSender: string;
    readonly internalUserId: string;
  };
  readonly openAi: {
    readonly endpoint: URL;
    readonly apiKey: string;
    readonly model: string;
    readonly timeoutMs: number;
  };
  readonly cosmos: {
    readonly endpoint: string;
    readonly databaseName: string;
    readonly sessionsContainerName: string;
    readonly inboundMessagesContainerName: string;
  };
  readonly investec: {
    readonly baseUrl: URL;
    readonly tokenUrl: URL;
    readonly clientId: string;
    readonly clientSecret: string;
    readonly apiKey: string;
    readonly timeoutMs: number;
  };
}

export function loadAppConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const timezone = optionalString(environment.APP_TIMEZONE, "Africa/Johannesburg");
  validateTimezone(timezone);

  return {
    nodeEnv: optionalString(environment.NODE_ENV, "development"),
    port: parseInteger(environment.PORT, "PORT", 3000, 1, 65_535),
    timezone,
    maxToolTurns: parseInteger(environment.MAX_AGENT_TOOL_TURNS, "MAX_AGENT_TOOL_TURNS", 3, 0, 20),
    systemPrompt: optionalString(
      environment.AGENT_SYSTEM_PROMPT,
      "You are Tjhelete, a private personal-banking assistant. Use approved tools for financial facts, be concise, and never invent account data.",
    ),
    twilio: {
      publicWebhookUrl: parseUrl(
        requiredString(environment.TWILIO_PUBLIC_WEBHOOK_URL, "TWILIO_PUBLIC_WEBHOOK_URL"),
        "TWILIO_PUBLIC_WEBHOOK_URL",
      ),
      authToken: requiredString(environment.TWILIO_AUTH_TOKEN, "TWILIO_AUTH_TOKEN"),
      allowedSender: parseWhatsAppAddress(
        requiredString(
          environment.TWILIO_ALLOWED_WHATSAPP_SENDER,
          "TWILIO_ALLOWED_WHATSAPP_SENDER",
        ),
        "TWILIO_ALLOWED_WHATSAPP_SENDER",
      ),
      internalUserId: requiredString(environment.APP_INTERNAL_USER_ID, "APP_INTERNAL_USER_ID"),
    },
    openAi: {
      endpoint: parseUrl(
        optionalString(environment.OPENAI_RESPONSES_URL, "https://api.openai.com/v1/responses"),
        "OPENAI_RESPONSES_URL",
      ),
      apiKey: requiredString(environment.OPENAI_API_KEY, "OPENAI_API_KEY"),
      model: optionalString(environment.OPENAI_MODEL, "gpt-5.6-sol"),
      timeoutMs: parseInteger(environment.MODEL_TIMEOUT_MS, "MODEL_TIMEOUT_MS", 30_000, 1, 120_000),
    },
    cosmos: {
      endpoint: parseUrl(
        requiredString(environment.COSMOS_ENDPOINT, "COSMOS_ENDPOINT"),
        "COSMOS_ENDPOINT",
      ).toString(),
      databaseName: optionalString(environment.COSMOS_DATABASE_NAME, "tjabane"),
      sessionsContainerName: optionalString(environment.COSMOS_SESSIONS_CONTAINER, "sessions"),
      inboundMessagesContainerName: optionalString(
        environment.COSMOS_INBOUND_MESSAGES_CONTAINER,
        "inboundMessages",
      ),
    },
    investec: {
      baseUrl: parseUrl(
        requiredString(environment.INVESTEC_BASE_URL, "INVESTEC_BASE_URL"),
        "INVESTEC_BASE_URL",
      ),
      tokenUrl: parseUrl(
        requiredString(environment.INVESTEC_TOKEN_URL, "INVESTEC_TOKEN_URL"),
        "INVESTEC_TOKEN_URL",
      ),
      clientId: requiredString(environment.INVESTEC_CLIENT_ID, "INVESTEC_CLIENT_ID"),
      clientSecret: requiredString(environment.INVESTEC_CLIENT_SECRET, "INVESTEC_CLIENT_SECRET"),
      apiKey: requiredString(environment.INVESTEC_API_KEY, "INVESTEC_API_KEY"),
      timeoutMs: parseInteger(
        environment.INVESTEC_TIMEOUT_MS,
        "INVESTEC_TIMEOUT_MS",
        10_000,
        1,
        120_000,
      ),
    },
  };
}

function requiredString(value: string | undefined, settingName: string): string {
  if (value === undefined || value.trim().length === 0) {
    throw new Error(`Missing required setting ${settingName}.`);
  }

  return value;
}

function optionalString(value: string | undefined, fallback: string): string {
  return value === undefined || value.trim().length === 0 ? fallback : value;
}

function parseInteger(
  value: string | undefined,
  settingName: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const parsed = value === undefined ? fallback : Number(value);

  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`Invalid ${settingName} value.`);
  }

  return parsed;
}

function parseUrl(value: string, settingName: string): URL {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("URL must use HTTP or HTTPS.");
    }

    return url;
  } catch {
    throw new Error(`Invalid ${settingName} URL.`);
  }
}

function parseWhatsAppAddress(value: string, settingName: string): string {
  if (!/^whatsapp:\+[1-9]\d{7,14}$/.test(value)) {
    throw new Error(`Invalid ${settingName} value.`);
  }

  return value;
}

function validateTimezone(timezone: string): void {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
  } catch {
    throw new Error("Invalid APP_TIMEZONE value.");
  }
}
