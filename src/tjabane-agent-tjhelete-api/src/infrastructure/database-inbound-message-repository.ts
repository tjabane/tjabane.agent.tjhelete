import { DatabaseConcurrencyError, type DatabaseClient } from "@tjabane-agent-tjhelete/repository";
import type {
  BeginInboundMessageResult,
  InboundMessageRecord,
  InboundMessageRepository,
} from "../contracts/inbound-message-repository.js";

export interface DatabaseInboundMessageRepositoryOptions {
  readonly collectionName?: string;
  readonly leaseDurationMs?: number;
  readonly retentionSeconds?: number;
  readonly now?: () => Date;
}

export class DatabaseInboundMessageRepository implements InboundMessageRepository {
  private readonly collectionName: string;
  private readonly leaseDurationMs: number;
  private readonly retentionSeconds: number;
  private readonly now: () => Date;

  public constructor(
    private readonly database: DatabaseClient,
    options: DatabaseInboundMessageRepositoryOptions = {},
  ) {
    this.collectionName = options.collectionName ?? "inboundMessages";
    this.leaseDurationMs = options.leaseDurationMs ?? 120_000;
    this.retentionSeconds = options.retentionSeconds ?? 86_400;
    this.now = options.now ?? (() => new Date());
  }

  public async begin(providerMessageId: string): Promise<BeginInboundMessageResult> {
    const now = this.now();
    const record: InboundMessageRecord = {
      id: providerMessageId,
      status: "processing",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: now.getTime() + this.leaseDurationMs,
      ttl: this.retentionSeconds,
    };

    if (await this.database.create(this.collectionName, record)) {
      return { status: "claimed" };
    }

    return this.resolveExistingClaim(providerMessageId, now);
  }

  public async complete(providerMessageId: string, reply: string): Promise<void> {
    const record = await this.requireRecord(providerMessageId);

    if (record.status === "completed") {
      return;
    }

    const now = this.now();
    await this.database.save(
      this.collectionName,
      {
        ...record,
        status: "completed",
        reply,
        updatedAt: now.toISOString(),
        expiresAt: undefined,
      },
      record.version,
    );
  }

  public async fail(providerMessageId: string): Promise<void> {
    const record = await this.database.findById<InboundMessageRecord>(
      this.collectionName,
      providerMessageId,
    );

    if (record === null || record.status !== "processing") {
      return;
    }

    await this.database.save(
      this.collectionName,
      {
        ...record,
        status: "failed",
        updatedAt: this.now().toISOString(),
        expiresAt: undefined,
      },
      record.version,
    );
  }

  private async resolveExistingClaim(
    providerMessageId: string,
    now: Date,
  ): Promise<BeginInboundMessageResult> {
    const record = await this.requireRecord(providerMessageId);

    if (record.status === "completed" && record.reply !== undefined) {
      return { status: "completed", reply: record.reply };
    }

    if (
      record.status === "processing" &&
      record.expiresAt !== undefined &&
      record.expiresAt > now.getTime()
    ) {
      return { status: "processing" };
    }

    try {
      await this.database.save(
        this.collectionName,
        {
          ...record,
          status: "processing",
          updatedAt: now.toISOString(),
          expiresAt: now.getTime() + this.leaseDurationMs,
        },
        record.version,
      );
      return { status: "claimed" };
    } catch (error) {
      if (error instanceof DatabaseConcurrencyError) {
        return { status: "processing" };
      }

      throw error;
    }
  }

  private async requireRecord(providerMessageId: string): Promise<InboundMessageRecord> {
    const record = await this.database.findById<InboundMessageRecord>(
      this.collectionName,
      providerMessageId,
    );

    if (record === null) {
      throw new Error("The inbound message claim no longer exists.");
    }

    return record;
  }
}
