/** Tracks only the model/texture requests registered for one active scene restoration. */
export class ResourceLoadSession {
  constructor({ timeoutMs = 30000, onChange = () => {} } = {}) {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('Asset timeout must be positive.');
    this.timeoutMs = timeoutMs;
    this.onChange = onChange;
    this.jobs = [];
    this.status = 'queued';
    this.done = new Promise(resolve => { this.resolve = resolve; });
  }

  add(descriptor, request, apply) {
    if (this.status !== 'queued') throw new Error('Cannot add requests after loading starts.');
    this.jobs.push({ ...descriptor, request, apply, status: 'queued', timer: null });
  }

  report() {
    return {
      status: this.status, total: this.jobs.length,
      loaded: this.jobs.filter(job => job.status === 'ready').length,
      pending: this.jobs.filter(job => ['queued', 'loading'].includes(job.status)).length,
      failures: this.jobs.filter(job => job.status === 'failed').map(job => ({
        entityId: job.entityId, entityName: job.entityName, kind: job.kind, reason: job.reason
      }))
    };
  }

  notify() { this.onChange(this.report()); }

  start() {
    if (this.status !== 'queued') return this.done;
    this.status = 'loading';
    this.notify();
    for (const job of this.jobs) {
      if (this.status === 'cancelled') break;
      job.status = 'loading';
      const settle = (error, asset) => {
        if (job.status !== 'loading' || this.status === 'cancelled') return;
        clearTimeout(job.timer);
        if (error || !asset?.resource) {
          job.status = 'failed'; job.reason = error === 'timeout' ? 'Loading timed out.' : 'Resource could not be loaded.';
        } else {
          try { job.apply(asset.resource, asset); job.status = 'ready'; }
          catch { job.status = 'failed'; job.reason = 'Loaded resource could not be applied.'; }
        }
        this.finishIfSettled();
      };
      job.timer = setTimeout(() => settle('timeout'), this.timeoutMs);
      try { job.request((error, asset) => settle(error, asset)); }
      catch { settle('request-failed'); }
    }
    this.finishIfSettled();
    return this.done;
  }

  finishIfSettled() {
    if (this.status !== 'loading') return;
    if (this.jobs.every(job => ['ready', 'failed'].includes(job.status))) {
      this.status = this.jobs.some(job => job.status === 'failed') ? 'failed' : 'ready';
      this.resolve(this.report());
    }
    this.notify();
  }

  cancel() {
    if (!['queued', 'loading'].includes(this.status)) return;
    this.status = 'cancelled';
    for (const job of this.jobs) {
      clearTimeout(job.timer);
      if (['queued', 'loading'].includes(job.status)) job.status = 'cancelled';
    }
    this.resolve(this.report());
    this.notify();
  }
}
