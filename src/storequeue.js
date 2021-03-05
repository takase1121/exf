const { nanoid } = require('nanoid')
const { Queue } = require('./queue')

const Metadata = () => ({ head: null, tail: null })
const Item = (prev, next, value) => ({ prev, next, value })

class StoreQueue extends Queue {
  constructor (store, metaKey) {
    super()
    this.store = store
    this.metaKey = metaKey
  }

  async metadata () {
    return (await this.store.get(this.metaKey)) ?? Metadata()
  }

  async unshift (value) {
    await this.store.transaction(async () => {
      const metadata = await this.metadata()
      const id = nanoid()

      const current = Item(null, metadata.head, value)
      await this.store.set(id, current)

      if (metadata.head) {
        const next = await this.store.get(metadata.head)
        next.prev = id
        await this.store.set(metadata.head, next)        
      }

      metadata.head = id
      if (!metadata.tail) { metadata.tail = id }

      await this.store.set(this.metaKey, metadata)
    })
  }

  async push (value) {
    await this.store.transaction(async () => {
      const metadata = await this.metadata()
      const id = nanoid()

      const current =  Item(metadata.tail, null, value)
      await this.store.set(id, current)

      if (metadata.tail) {
        const prev = await this.store.get(metadata.tail)
        prev.next = id
        await this.store.set(metadata.tail, prev)
      }

      metadata.tail = id
      if (!metadata.head) { metadata.head = id }

      await this.store.set(this.metaKey, metadata)
    })
  }

  async shift () {
    return await this.store.transaction(async () => {
      const meta = await this.metadata()

      const head = await this.store.get(meta.head)
      if (!head) { return }

      if (head.next) {
        const next = await this.store.get(head.next)
        next.prev = null
        await this.store.set(head.next, next)
      } else {
        meta.tail = null
      }

      await this.store.delete(meta.head)
      meta.head = head.next

      await this.store.set(this.metaKey, meta)
      return head.value
    })
  }

  async pop () {
    return await this.store.transaction(async () => {
      const meta = await this.metadata()

      const tail = await this.store.get(meta.tail)
      if (!tail) { return }

      if (tail.prev) {
        const prev = await this.store.get(tail.prev)
        prev.next = null
        await this.store.set(tail.prev, prev)
      } else {
        meta.head = null
      }

      await this.store.delete(meta.tail)
      meta.tail = tail.prev

      await this.store.set(this.metaKey, meta)
      return tail.value
    })
  }

  async size () {
    const total = await this.store.size()
    return total - 1 // account for metakey
  }

  async dump () {
    return await this.store.transaction(async () => {
      const result = []
      let { head: next } = await this.metadata()

      while (next) {
        const d = await this.store.get(next)
        next = d.next
        result.push(d.value)
      }
      return result
    })
  }
  
  async clear () {
    await this.store.transaction(async() => {
      const promise = []
      let { head: next } = await this.metadata()

      while (next) {
        const d = await this.store.get(next)
        promise.push(this.store.delete(next))
        next = d.next
      }
      await Promise.all(promise)
      await this.store.set(this.metaKey, Metadata())
    })
  }
}

exports.StoreQueue = StoreQueue
