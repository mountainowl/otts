import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkerClient } from '../src/worker-client.js';

class FakeWorker {
  listeners = {};
  postMessage = vi.fn();
  terminate = vi.fn();

  addEventListener(type, listener) {
    this.listeners[type] = listener;
  }

  reply(data) {
    this.listeners.message({ data });
  }
}

describe('WorkerClient', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reuses one worker and resolves replies by request id', async () => {
    const worker = new FakeWorker();
    vi.stubGlobal('Worker', class {});
    const client = new WorkerClient(
      () => worker,
      ({ result }) => result,
      'unavailable',
    );

    const first = client.request({ action: 'first' });
    const second = client.request({ action: 'second' });
    worker.reply({ id: 2, result: 'two' });
    worker.reply({ id: 1, result: 'one' });

    await expect(first).resolves.toBe('one');
    await expect(second).resolves.toBe('two');
    expect(worker.postMessage).toHaveBeenCalledTimes(2);
  });

  it('terminates active work and rejects pending requests', async () => {
    const worker = new FakeWorker();
    vi.stubGlobal('Worker', class {});
    const client = new WorkerClient(
      () => worker,
      ({ result }) => result,
      'unavailable',
    );
    const request = client.request({ action: 'slow' });

    client.stop();

    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
