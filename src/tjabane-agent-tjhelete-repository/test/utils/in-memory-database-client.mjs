export class InMemoryDatabaseClient {
  collections = new Map();

  constructor(seed = {}) {
    for (const [collectionName, records] of Object.entries(seed)) {
      this.collections.set(
        collectionName,
        new Map(records.map((record) => [record.id, cloneRecord(record)])),
      );
    }
  }

  async findById(collectionName, id) {
    const record = this.getCollection(collectionName).get(id);

    return record === undefined ? null : cloneRecord(record);
  }

  async findOne(collectionName, query) {
    for (const record of this.getCollection(collectionName).values()) {
      const matchesQuery = Object.entries(query).every(([key, value]) => record[key] === value);

      if (matchesQuery) {
        return cloneRecord(record);
      }
    }

    return null;
  }

  async create(collectionName, record) {
    const collection = this.getCollection(collectionName);

    if (collection.has(record.id)) {
      return false;
    }

    collection.set(record.id, cloneRecord(record));
    return true;
  }

  async save(collectionName, record, expectedVersion) {
    const collection = this.getCollection(collectionName);
    const existing = collection.get(record.id);

    if (expectedVersion !== undefined && existing?.version !== expectedVersion) {
      throw new Error("The record was changed by another operation.");
    }

    collection.set(record.id, cloneRecord(record));
  }

  async delete(collectionName, id) {
    this.getCollection(collectionName).delete(id);
  }

  getRecord(collectionName, id) {
    const record = this.getCollection(collectionName).get(id);

    return record === undefined ? null : cloneRecord(record);
  }

  getCollection(collectionName) {
    const existingCollection = this.collections.get(collectionName);

    if (existingCollection !== undefined) {
      return existingCollection;
    }

    const collection = new Map();
    this.collections.set(collectionName, collection);

    return collection;
  }
}

function cloneRecord(record) {
  return JSON.parse(JSON.stringify(record));
}
