const { clone: queueClone } = require('../');
const makeQueue = () => {
  const queue = queueClone();
  let storedCallback = null;
  queue.setImplementation((runCallback, opts) => {
    storedCallback = runCallback;
  });
  const cb = (timeRemaining = null, didTimeout = false) => {
    if (!storedCallback) {
      throw new Error(`queue never called requestIdleTimeout`);
    }
    if (!timeRemaining) {
      timeRemaining = () => 1000;
    }
    storedCallback({ timeRemaining, didTimeout });
  };

  return { queue, cb };
};

it(`doesn't error`, () => {
  const { queue } = makeQueue();
  queue.push(() => {});
});

it(`calls the callback`, () => {
  const { queue, cb } = makeQueue();
  const fn = jest.fn();
  queue.push(fn);
  expect(fn).not.toHaveBeenCalled();
  cb();
  expect(fn).toHaveBeenCalled();
});

it(`unqueue`, () => {
  const { queue, cb } = makeQueue();
  const fn = jest.fn();
  queue.push(fn);
  expect(queue.cbs()).toHaveLength(1);
  queue.unqueue(fn);
  expect(queue.cbs()).toHaveLength(0);
  cb();
  expect(fn).not.toHaveBeenCalled();
});

it(`doesn't trigger callbacks added while runNow is executing`, () => {
  const { queue, cb } = makeQueue();
  const second = jest.fn();
  const first = jest.fn(() => {
    queue.push(second);
  });
  queue.push(first);
  cb();
  expect(first).toHaveBeenCalled();
  expect(second).not.toHaveBeenCalled();
  cb();
  expect(second).toHaveBeenCalled();
});

describe(`drain`, () => {
  it(`works on no callback registered`, () => {
    const { queue, cb } = makeQueue();
    const p = queue.drain();
    expect(p).toBeInstanceOf(Promise);
    return p;
  });

  it(`works for one callback`, () => {
    const { queue, cb } = makeQueue();
    const fn = jest.fn();
    queue.push(fn);
    const p = queue.drain();
    expect(p).toBeInstanceOf(Promise);
    expect(queue.cbs()).toHaveLength(1);
    cb();
    expect(fn).toHaveBeenCalled();
    return p.then(() => {
      expect(queue.cbs()).toHaveLength(0);
    });
  });
});

