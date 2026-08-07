export interface InboundMessageRecord {
  readonly id: string;
  readonly status: "processing" | "completed" | "failed";
  readonly reply?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly expiresAt?: number;
  readonly ttl?: number;
  readonly version?: string;
}

export type BeginInboundMessageResult =
  | { readonly status: "claimed" }
  | { readonly status: "processing" }
  | { readonly status: "completed"; readonly reply: string };

export interface InboundMessageRepository {
  begin(providerMessageId: string): Promise<BeginInboundMessageResult>;
  complete(providerMessageId: string, reply: string): Promise<void>;
  fail(providerMessageId: string): Promise<void>;
}
