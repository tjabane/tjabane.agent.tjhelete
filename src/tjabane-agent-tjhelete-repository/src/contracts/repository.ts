import type { IEntity } from "../entities/entity.js";

export interface IRepository<TEntity extends IEntity<TId>, TId = string> {
  findById(id: TId): Promise<TEntity | null>;
  save(entity: TEntity): Promise<void>;
  delete(id: TId): Promise<void>;
}
