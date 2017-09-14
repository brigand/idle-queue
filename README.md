Batches [requestIdleCallback] calls, honors the deadline

[requestIdleCallback]: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback

## Install

```
npm install --save idle-queue
```

## Usage

Import the queue. By default it includes the [polyfill].

[polyfill]: https://github.com/PixelsCommander/requestIdleCallback-polyfill

```js
var idleQueue = require('idle-queue');

// without shim
var idleQueue = require('idle-queue/noShim');
```

Then add a function to the queue.

```js
idleQueue.push(() => { console.log('Hi'); });
```

If you save the function (note: uses `===`), you can remove it from the queue.

```js
const callback = () => { console.log('I will not run'); };
idleQueue.push(callback);
idleQueue.has(callback); // => true
idleQueue.unqueue(callback);
idleQueue.has(callback); // => false
```

You can specify an estimated execution time. It defaults to 1ms.

```js
idleQueue.push(() => { console.log('Hi'); }, { estimate: 100 });
```

Currently only one timeout can be configured per queue. If this amount of time passes without the browser having an idle period, it will start executing queued operations. It defaults to 500ms. Will not take effect until after a currently running idle timeout finishes.

```js
idleQueue.setTimeout(1000);
```

The [IdleDeadline] object is passed as the first argument to your callback.

```js
idleQueue.push((deadline) => {
  console.log(`I can run for ${deadline.timeRemaining()}ms`);
});
```


You can set a `requestIdleCallback` function to use in the queue. This is mostly useful for unit testing.

```js
idleQueue.setImplementation(requestIdleCallback);
```

Also mostly for unit tests, you can flush the queue. It requires you implement a custom [IdleDeadline].

```js
idleQueue.runNow({
  // if returns 0, no callbacks will run
  // if returns Infinity, all callbacks will run
  timeRemaining: () => Infinity,
  didTimeout: false,
});
```

You can receive a promise of the queue draining. Again, mostly for unit tests.

```js
idleQueue.drain().then(() => {
  console.log(`No callbacks in the queue`);
});
```

[IdleDeadline]: https://developer.mozilla.org/en-US/docs/Web/API/IdleDeadline
## Instances

The module exports a queue object, but it also has a `.clone()` method which returns an independent queue.

Usually you want all of your code

```js
var idleQueue = require('idle-queue').clone();
```


