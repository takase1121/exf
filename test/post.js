const fs = require('fs')

console.log('Cleaning up database')
try {
    fs.unlinkSync('test.mdb')
    fs.unlinkSync('test.mdb-lock')
} catch {}