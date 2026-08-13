/** Serializes Mol* state-tree rebuilds and invalidates superseded requests. */
export class MolstarPresentationRebuildGate {
  private version = 0;
  private queue: Promise<void> = Promise.resolve();

  schedule(task: (isCurrent: () => boolean) => Promise<void>): Promise<void> {
    const requestVersion = this.version + 1;
    this.version = requestVersion;
    this.queue = this.queue
      .catch(() => undefined)
      .then(() => task(() => requestVersion === this.version));
    return this.queue;
  }

  invalidate() {
    this.version += 1;
  }
}
