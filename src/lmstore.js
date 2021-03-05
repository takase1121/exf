const { Store } = require('./store')

class LMStore extends Store {
  constructor (db, sizeKey) {
    super()
    this.db = db
    this.sizeKey = sizeKey
  }

  async get (key) {
    return this.db.get(key)
  }

  async set (key, value) {
    await this.db.transaction(async () => {
      const isNew = !this.db.get(key)
      const res = await this.db.put(key, value)
      if (isNew && res) {
        const size = this.db.get(this.sizeKey) ?? 0
        await this.db.put(this.sizeKey, size + 1)
      }
    })
  }

  async delete (key) {
    await this.db.transaction(async () => {
      const res = await this.db.remove(key)
      if (res) {
        const size = this.db.get(this.sizeKey) ?? 0
        await this.db.put(this.sizeKey, Math.max(size - 1, 0))
      }
    })
  }

  async size () {
    return this.db.get(this.sizeKey) ?? 0
  }

  async transaction (fn) {
    return this.db.transaction(fn)
  }
}

exports.LMStore = LMStore
