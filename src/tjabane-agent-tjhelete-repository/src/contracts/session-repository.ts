import type { Session } from "../entities/session.js";
import type { IRepository } from "./repository.js";

export interface ISessionRepository extends IRepository<Session> {
  findByUserId(userId: string): Promise<Session | null>;
  create(session: Session): Promise<boolean>;
}
