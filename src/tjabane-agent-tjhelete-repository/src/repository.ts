export interface IEntity<TId = string> {
  id: TId;
}

export interface IRepository<TEntity extends IEntity<TId>, TId = string> {
  findById(id: TId): Promise<TEntity | null>;
  save(entity: TEntity): Promise<void>;
  delete(id: TId): Promise<void>;
}
