var idleQueue = require('../src/index.js');

idleQueue.push(() => {
  console.log('a');
  idleQueue.push(() => {
    console.log('c');
  });
});


idleQueue.push(() => {
  console.log('b');
});

