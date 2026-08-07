import type { Container, CosmosClient, SqlQuerySpec } from "@azure/cosmos";
import type {
  DatabaseClient,
  DatabaseQuery,
  DatabaseRecord,
} from "../contracts/database-client.js";
import { DatabaseConcurrencyError } from "../errors/database-concurrency-error.js";

export type CosmosPartitionKeyValue = string | number | boolean | null;

export interface CosmosDatabaseClientOptions {
  readonly partitionKeyValueForId?: (collectionName: string, id: string) => CosmosPartitionKeyValue;
}

export class CosmosDatabaseClient implements DatabaseClient {
  public constructor(
    private readonly cosmosClient: Pick<CosmosClient, "database">,
    private readonly databaseName: string,
    private readonly options: CosmosDatabaseClientOptions = {},
  ) {}

  public async findById<TRecord extends DatabaseRecord>(
    collectionName: string,
    id: string,
  ): Promise<TRecord | null> {
    try {
      const response = await this.getContainer(collectionName)
        .item(id, this.getPartitionKeyValue(collectionName, id))
        .read<TRecord>();

      return response.resource === undefined ? null : this.mapStoredRecord(response.resource);
    } catch (error) {
      if (this.hasStatus(error, 404)) {
        return null;
      }

      throw error;
    }
  }

  public async findOne<TRecord extends DatabaseRecord>(
    collectionName: string,
    query: DatabaseQuery,
  ): Promise<TRecord | null> {
    const response = await this.getContainer(collectionName)
      .items.query<TRecord>(this.createFindOneQuery(query))
      .fetchAll();

    const record = response.resources[0];

    return record === undefined ? null : this.mapStoredRecord(record);
  }

  public async create<TRecord extends DatabaseRecord>(
    collectionName: string,
    record: TRecord,
  ): Promise<boolean> {
    try {
      await this.getContainer(collectionName).items.create(this.toStoredRecord(record));
      return true;
    } catch (error) {
      if (this.hasStatus(error, 409)) {
        return false;
      }

      throw error;
    }
  }

  public async save<TRecord extends DatabaseRecord>(
    collectionName: string,
    record: TRecord,
    expectedVersion?: string,
  ): Promise<void> {
    const storedRecord = this.toStoredRecord(record);

    if (expectedVersion === undefined) {
      await this.getContainer(collectionName).items.upsert(storedRecord);
      return;
    }

    try {
      await this.getContainer(collectionName)
        .item(record.id, this.getPartitionKeyValue(collectionName, record.id))
        .replace(storedRecord, {
          accessCondition: {
            type: "IfMatch",
            condition: expectedVersion,
          },
        });
    } catch (error) {
      if (this.hasStatus(error, 412)) {
        throw new DatabaseConcurrencyError();
      }

      throw error;
    }
  }

  public async delete(collectionName: string, id: string): Promise<void> {
    try {
      await this.getContainer(collectionName)
        .item(id, this.getPartitionKeyValue(collectionName, id))
        .delete();
    } catch (error) {
      if (this.hasStatus(error, 404)) {
        return;
      }

      throw error;
    }
  }

  private getContainer(collectionName: string): Container {
    return this.cosmosClient.database(this.databaseName).container(collectionName);
  }

  private getPartitionKeyValue(collectionName: string, id: string): CosmosPartitionKeyValue {
    return this.options.partitionKeyValueForId?.(collectionName, id) ?? id;
  }

  private createFindOneQuery(query: DatabaseQuery): SqlQuerySpec {
    const queryEntries = Object.entries(query);

    if (queryEntries.length === 0) {
      throw new Error("Cosmos findOne query must include at least one field.");
    }

    return {
      query: `SELECT TOP 1 * FROM c WHERE ${queryEntries
        .map(([fieldName], index) => `${this.formatFieldName(fieldName)} = @value${index}`)
        .join(" AND ")}`,
      parameters: queryEntries.map(([, value], index) => ({
        name: `@value${index}`,
        value,
      })),
    };
  }

  private formatFieldName(fieldName: string): string {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(fieldName)) {
      throw new Error(`Cosmos query field '${fieldName}' is not supported.`);
    }

    return `c.${fieldName}`;
  }

  private mapStoredRecord<TRecord extends DatabaseRecord>(
    record: TRecord & { readonly _etag?: string },
  ): TRecord {
    const { _etag, version: _version, ...data } = record;

    return {
      ...data,
      ...(_etag === undefined ? {} : { version: _etag }),
    } as TRecord;
  }

  private toStoredRecord<TRecord extends DatabaseRecord>(
    record: TRecord,
  ): Omit<TRecord, "version"> {
    const { version: _version, ...storedRecord } = record;

    return storedRecord;
  }

  private hasStatus(error: unknown, expectedStatus: number): boolean {
    return (
      this.isObject(error) &&
      ("code" in error || "statusCode" in error) &&
      (error.code === expectedStatus || error.statusCode === expectedStatus)
    );
  }

  private isObject(value: unknown): value is {
    readonly code?: number | string;
    readonly statusCode?: number;
  } {
    return typeof value === "object" && value !== null;
  }
}
