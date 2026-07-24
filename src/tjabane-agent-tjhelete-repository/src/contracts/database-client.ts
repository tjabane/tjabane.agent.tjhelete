export type DatabaseQueryValue = string | number | boolean | null;

export type DatabaseQuery = Readonly<Record<string, DatabaseQueryValue>>;

export interface DatabaseRecord {
  readonly id: string;
}

export interface DatabaseClient {
  findById<TRecord extends DatabaseRecord>(
    collectionName: string,
    id: string,
  ): Promise<TRecord | null>;

  findOne<TRecord extends DatabaseRecord>(
    collectionName: string,
    query: DatabaseQuery,
  ): Promise<TRecord | null>;

  save<TRecord extends DatabaseRecord>(
    collectionName: string,
    record: TRecord,
  ): Promise<void>;

  delete(collectionName: string, id: string): Promise<void>;
}
