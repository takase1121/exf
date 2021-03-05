class Store {
  async get (key) {}

  async set (key, value) {}

  async delete (key) {}

  async size () {}

  async transaction () {}
}

exports.Store = Store
