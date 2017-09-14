function makeQueue() {
  let timeout = 500;
  let rIC = typeof requestIdleCallback === 'function'
    ? requestIdleCallback
    : undefined;
  let running = false;
  let drainPromise = null;
  let drainResolve = null;

  // These arrays are kept in sync
  // callbacks[7] matches up with estimates[7]
  const callbacks = [];
  const estimates = [];
  const _getIndex = (callback) => callbacks.indexOf(callback);

  const shouldRunCallback = (deadline, estimate = 0) => {
    if (deadline.didTimeout) return true;
    const remaining = deadline.timeRemaining();
    if (remaining <= 0) return true;
    return remaining - estimate > 0;
  };

  const runNow = (deadline) => {
    running = false;
    let toRemove = 0;
    const _callbacks = callbacks.slice();
    const _estimates = estimates.slice();
    for (let i = 0; i < _callbacks.length; i += 1) {
      const estimate = _estimates[i];
      if (shouldRunCallback(deadline, _estimates[i])) {
        const callback = _callbacks[i];
        callback(deadline);
        toRemove = i + 1;
      } else {
        break;
      }
    }

    if (toRemove) {
      callbacks.splice(0, toRemove);
      estimates.splice(0, toRemove);
    }
    if (!callbacks.length && drainResolve) {
      drainResolve();
      drainPromise = null;
      drainResolve = null;
    }
  };

  const startIfNeeded = () => {
    if (running) return;
    if (!rIC) {
      throw new TypeError(`idle-queue tried to run without requestIdleCallback being available`);
    };
    running = true;
    rIC(runNow, { timeout });
  };


  const clone = makeQueue;
  const setImplementation = (requestIdleCallback) => {
    rIC = requestIdleCallback;
  };
  const setTimeout = (ms) => { timeout = ms; };
  const has = (callback) => _getIndex(callback) !== -1;
  const push = (func, opts) => {
    callbacks.push(func);
    if (opts && typeof opts.estimate === 'number') {
      estimates.push(opts.estimate);
    } else {
      estimates.push(1);
    }
    startIfNeeded();
  };
  const unqueue = (callback) => {
    const index = _getIndex(callback);
    if (index !== -1) {
      callbacks.splice(index, 1)
      estimates.splice(index, 1);
    };
  };

  const drain = () => {
    if (drainPromise) return drainPromise;
    if (!callbacks.length) return Promise.resolve();
    drainPromise = new Promise((resolve) => {
      drainResolve = resolve;
    });
    return drainPromise;
  };

  const idleQueue = {
    clone,
    setImplementation,
    has,
    push,
    unqueue,
    runNow,
    drain,

    // for our unit tests
    cbs: () => callbacks,
  };

  return idleQueue;
}

module.exports = makeQueue();

