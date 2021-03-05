const tap = require('tap')
const { open } = require('lmdb-store')
const { LMStore } = require('../src/lmstore')
const { StoreQueue } = require('../src/storequeue')

const db = open({
  path: 'test.mdb'
})
const testdb = db.openDB('test2', {
  useVersions: true
})
const store = new LMStore(testdb, '__size')
const queue = new StoreQueue(store, '__meta')

tap.test('push', async t => {
  await queue.push(1)
  await queue.push('two')
  await queue.push({ three: 3 })
})

tap.test('pop', async t => {
  const r = await queue.pop()
  t.deepEqual(r, { three: 3 })
})

tap.test('shift', async t => {
  const r = await queue.shift()
  t.deepEqual(r, 1)
})

tap.test('unshift', async t => {
  await queue.unshift(3)
})

tap.test('size', async t => {
  t.equal(await queue.size(), 2)
})

tap.test('dump', async t => {
  const r = await queue.dump()
  t.deepEqual(r, [3, 'two'])
})

tap.test('clear', async t => {
  await queue.clear()
  t.equal(await queue.size(), 0)
})

tap.test('unshift set tail if n(queue) = 1', async t => {
  await queue.unshift(1)
  const m = await queue.metadata()
  t.equal(m.tail, m.head)
})

tap.test('push set head if n(queue) = 1', async t => {
  await queue.clear()
  await queue.push(1)
  const m = await queue.metadata()
  t.equal(m.head, m.tail)
})


tap.test('pop reset tail once queue is empty', async t => {
  await queue.pop()
  const m = await queue.metadata()
  t.equal(m.tail, null)
})

tap.test('shift reset head once queue is empty', async t => {
  await queue.push(1)
  await queue.shift()
  const m = await queue.metadata()
  t.equal(m.head, null)
})

tap.test('pop and shift empty', async t => {
  t.equal(await queue.pop(), undefined)
  t.equal(await queue.shift(), undefined)
})