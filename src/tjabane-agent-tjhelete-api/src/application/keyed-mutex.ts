export class KeyedMutex {
  private readonly tails = new Map<string, Promise<void>>();

  public async run<T>(key: string, action: () => Promise<T>): Promise<T> {
    const previous = this.tails.get(key) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.tails.set(key, current);
    await previous;

    try {
      return await action();
    } finally {
      release();

      if (this.tails.get(key) === current) {
        this.tails.delete(key);
      }
    }
  }
}
