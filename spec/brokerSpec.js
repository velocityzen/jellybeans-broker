/*eslint-env jasmine*/
'use strict';
const rdb = require('rethinkdbdash');
const Log = require('jellybeans');
const Broker = require('../lib/index');

const STATUS = Log.STATUS;
const eventTable = 'e';
const contentTable = 'e_content';

let rxUUID = /^([0-9a-f]){8}(-([0-9a-f]){4}){3}-([0-9a-f]){12}$/i;

describe('Broker >', () => {
  let db = rdb({
    db: 'test',
    optionalRun: false
  });

  let log = new Log({ db, eventTable, contentTable });

  beforeAll(done => {
    db.tableCreate(eventTable).run()
      .then(() => db.tableCreate(contentTable).run())
      .then(() => db.table(eventTable).indexCreate('created').run())
      .then(() => db.table(eventTable).indexCreate('received').run())
      .then(() => db.table(eventTable).indexWait('created', 'received').run())
      .then(() => done());
  }, 30000);

  afterAll(done => {
    db.tableDrop(eventTable).run()
      .then(() => db.tableDrop(contentTable).run())
      .then(() => done());
  }, 30000);

  let broker;
  it('creates and starts a broker', done => {
    broker = new Broker(log, {
      id: 'test',
      task: (task, status, cb) => {
        // console.log('task', task, status);
      },
      error: error => {
        // console.log('error', error);
      }
    });

    broker
      .start()
      .asCallback((err) => {
        expect(err).toBeFalsy();
        done();
      });
  });

  let taskId;
  it('pushes simple task', done => {
    broker
      .push({ task: 'task' })
      .asCallback((err, res) => {
        expect(err).toBeFalsy();
        expect(res).toBeDefined();
        expect(res.length).toBe(1);
        expect(res[0]).toMatch(rxUUID);
        taskId = res[0];
        done();
      });
  });

  it('fails to start broker again', done => {
    expect(broker.start()).toBeFalsy();
    done();
  });

  it('checks task data in the log', done => {
    log.getEvent(taskId)
      .then(event => {
        expect(event).toBeDefined();
        expect(event.content).toEqual({ task: 'task' });
        expect(event.id).toBe(taskId);
        expect(event.log).toBe('broker-test');
        expect(event.status).toBe(STATUS.CREATED);
        done();
      });
  });

  it('stops broker', done => {
    broker.stop();
    done();
  });

});
