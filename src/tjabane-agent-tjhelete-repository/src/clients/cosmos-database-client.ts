import type { Container, CosmosClient, SqlQuerySpec } from "@azure/cosmos";
import type {
  DatabaseClient,
  DatabaseQuery,
  DatabaseRecord,
} from "../contracts/database-client.js";

export type CosmosPartitionKeyValue = string | number | boolean | null;

export interface CosmosDatabaseClientOptions {
  readonly partitionKeyValueForId?: (
    collectionName: string,
    id: string,
  ) => CosmosPartitionKeyValue;
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

      return response.resource ?? null;
    } catch (error) {
      if (this.isNotFoundError(error)) {
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

    return response.resources[0] ?? null;
  }

  public async save<TRecord extends DatabaseRecord>(
    collectionName: string,
    record: TRecord,
  ): Promise<void> {
    await this.getContainer(collectionName).items.upsert(record);
  }

  public async delete(collectionName: string, id: string): Promise<void> {
    try {
      await this.getContainer(collectionName)
        .item(id, this.getPartitionKeyValue(collectionName, id))
        .delete();
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return;
      }

      throw error;
    }
  }

  private getContainer(collectionName: string): Container {
    return this.cosmosClient
      .database(this.databaseName)
      .container(collectionName);
  }

  private getPartitionKeyValue(
    collectionName: string,
    id: string,
  ): CosmosPartitionKeyValue {
    return this.options.partitionKeyValueForId?.(collectionName, id) ?? id;
  }

  private createFindOneQuery(query: DatabaseQuery): SqlQuerySpec {
    const queryEntries = Object.entries(query);

    if (queryEntries.length === 0) {
      throw new Error("Cosmos findOne query must include at least one field.");
    }

    return {
      query: `SELECT TOP 1 * FROM c WHERE ${queryEntries
        .map(
          ([fieldName], index) =>
            `${this.formatFieldName(fieldName)} = @value${index}`,
        )
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

  private isNotFoundError(error: unknown): boolean {
    return (
      this.isObject(error) &&
      ("code" in error || "statusCode" in error) &&
      (error.code === 404 || error.statusCode === 404)
    );
  }

  private isObject(value: unknown): value is {
    readonly code?: number | string;
    readonly statusCode?: number;
  } {
    return typeof value === "object" && value !== null;
  }
}
