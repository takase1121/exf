const tap = require('tap')
const { open } = require('lmdb-store')
const { LMStore } = require('../src/lmstore')

const db = open({
  path: 'test.mdb'
})
const testdb = db.openDB('test')
const store = new LMStore(testdb, '__size')

tap.test('set', async t => {
  await store.set('Hello', 'World!')
  t.equal(await store.size(), 1)
})

tap.test('get', async t => {
  t.equal(await store.get('Hello'), 'World!')
})

tap.test('delete', async t => {
  await store.delete('Hello')
  t.equal(await store.get('Hello'), undefined)
  t.equal(await store.size(), 0)
})
