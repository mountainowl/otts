/**
 * Correlates browser-worker replies with their originating promises.
 *
 * The client owns worker creation, request IDs, failure fan-out, and shutdown.
 * Callers only provide the worker factory and how a successful reply is read.
 * यह क्लास worker lifecycle और लंबित requests को एक ही स्थान पर संभालती है।
 */
export class WorkerClient {
  #nextId = 0;
  #pending = new Map();
  #worker;

  /**
   * @param {() => Worker} createWorker Creates a worker lazily on first use.
   * @param {(data: object) => unknown} readResult Extracts a successful result.
   * @param {string} unavailableMessage Error used when workers are unsupported.
   */
  constructor(createWorker, readResult, unavailableMessage) {
    this.createWorker = createWorker;
    this.readResult = readResult;
    this.unavailableMessage = unavailableMessage;
  }

  /** Sends one request and resolves only the matching worker response. */
  request(payload) {
    if (!globalThis.Worker)
      return Promise.reject(new Error(this.unavailableMessage));
    this.#worker ??= this.#startWorker();
    const id = ++this.#nextId;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      this.#worker.postMessage({ id, ...payload });
    });
  }

  /** Terminates active work and rejects every request with one AbortError. */
  stop() {
    if (!this.#worker || !this.#pending.size) return;
    this.#worker.terminate();
    this.#worker = undefined;
    const error = new DOMException('Speech generation stopped.', 'AbortError');
    for (const request of this.#pending.values()) request.reject(error);
    this.#pending.clear();
  }

  #startWorker() {
    const worker = this.createWorker();
    worker.addEventListener('message', ({ data }) => this.#resolve(data));
    worker.addEventListener('error', (error) => this.#rejectAll(error));
    return worker;
  }

  #resolve(data) {
    const request = this.#pending.get(data.id);
    if (!request) return;
    this.#pending.delete(data.id);
    if (data.error) request.reject(new Error(data.error));
    else request.resolve(this.readResult(data));
  }

  #rejectAll(error) {
    for (const request of this.#pending.values()) request.reject(error);
    this.#pending.clear();
  }
}
