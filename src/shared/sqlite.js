const Database = require('better-sqlite3');

function first(dbPath, query) {
    return createDb(dbPath).prepare(query).get();
}

function createDb(dbPath) {
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    return db;
}

module.exports = {
    first
};
