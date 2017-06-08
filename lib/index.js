'use strict';

const Broker = function(log, opts = {}) {
  this.log = log;
  this.id = opts.id;
  this.onTask = opts.task;
  this.onError = opts.error;
  this.deleteCompleted = opts.deleteCompleted;
};

Broker.prototype.start = function() {
  if (this.cursor) {
    return;
  }

  return this.log.query({
    logs: [ `broker-${this.id}` ],
    status: this.log.STATUS.CREATED,
    live: true
  })
  .run({ cursor: true })
  .then(cursor => this.onCursor(cursor));
};

Broker.prototype.stop = function() {
  this.cursor && this.cursor.close();
  this.cursor = undefined;
};

Broker.prototype.onCursor = function(cursor) {
  this.cursor = cursor;

  cursor.each((err, res) => {
    if (err) {
      console.log('on cursor error', err);
      return this.onError(err);
    }

    if (!res.old_val && res.new_val) {
      const task = res.new_val;
      this.onTask(task.content, task.status, status => this.taskComplete(task.id, status));
    }
  })
};

Broker.prototype.taskComplete = function(id, status) {
  if (this.deleteCompleted) {
    return this.log.delete(id);
  }

  return this.log.setStatus(id, status || this.log.STATUS.DONE);
};

Broker.prototype.push = function(task) {
  return this.log.add({
    log: `broker-${this.id}`,
    created: Date.now(),
    content: task
  });
};


module.exports = Broker;
