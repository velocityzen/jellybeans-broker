# Tasks broker

Jellybeans broker uses [jellybeans](https://github.com/velocityzen/jellybeans) as streamable event log to manage tasks. It uses [rethinkdb](https://www.rethinkdb.com) as storage.

# Installation

`npm i jellybeans jellybeans-broker`

# Usage

```js
let Log = require('jellybeans');
let Broker = require('jellybeans-broker');

let log = new Log({
  db,           //your rethinkdbdash connection
  eventTable,   //event table name
  contentTable  //event content table name
});

let broker = new Broker(log, {
  id: 'unique_id',
  task: (data, status, cb) => {
    console.log(data, status);
    cb();
  },
  error: error => console.log(error)
});

broker
  .start()
  .then(() => {
    broker.push({
      task: 'data'
    })
  });
```

## Options
* **id** — unique broker id,
* **task** — task callback,
* **error** — error callback
* **deleteCompleted** — default `false`. If `true` broker deletes completed tasks from db. If `false` updates status to `done` (for more info check the jellybeans documentation)

## Methods
### push(task)
saves task. `task` can be anything, number, string, object.

### start()
Connects to db, retrives not completed tasks. Return promise, so you can wait for broker to be ready, but that isn't nessesary. You can start pushing tasks right away.

License: MIT


