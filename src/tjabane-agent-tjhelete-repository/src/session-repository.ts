import type { DatabaseClient } from "./database-client.js";
import {
  mapSession,
  mapSessionRecord,
  type SessionRecord,
} from "./mappers/session-record-mapper.js";
import type { ISessionRepository, Session } from "./session.js";

export class SessionRepository implements ISessionRepository {
  public constructor(
    private readonly databaseClient: DatabaseClient,
    private readonly collectionName = "sessions",
  ) {}

  public async findById(id: string): Promise<Session | null> {
    const record = await this.databaseClient.findById<SessionRecord>(
      this.collectionName,
      id,
    );

    return record === null ? null : mapSessionRecord(record);
  }

  public async findByUserId(userId: string): Promise<Session | null> {
    const record = await this.databaseClient.findOne<SessionRecord>(
      this.collectionName,
      { userId },
    );

    return record === null ? null : mapSessionRecord(record);
  }

  public async save(session: Session): Promise<void> {
    await this.databaseClient.save(this.collectionName, mapSession(session));
  }

  public async delete(id: string): Promise<void> {
    await this.databaseClient.delete(this.collectionName, id);
  }
}
