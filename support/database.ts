import {readFile} from 'node:fs/promises'
import mariadb, {type Connection} from 'mariadb'
import {env} from './env'

/** A connection to the API's database that can run testdata.sql in one query. */
export function connectToDatabase(): Promise<Connection> {
  return mariadb.createConnection({...env.db, multipleStatements: true})
}

let testData: Promise<string> | undefined
const checkedConnections = new WeakSet<Connection>()

/**
 * Brings the API's database back to this repo's data/testdata.sql: it deletes all rows and inserts the
 * test data with fixed IDs, so it can run again and again. AUTO_INCREMENT counters stay where they
 * are, so rows the API creates get unpredictable IDs.
 *
 * The first reset on a connection checks that the file empties every table (see assertEmptiesAllTables).
 */
export async function resetDatabase(connection: Connection): Promise<void> {
  testData ??= readFile(env.testDataSql, 'utf8')
  const sql = await testData
  if (!checkedConnections.has(connection)) {
    await assertEmptiesAllTables(connection, sql)
    checkedConnections.add(connection)
  }
  await connection.query(sql)
}

/**
 * Fails when a table in the schema has no `delete from` in testdata.sql. Such a table (for example one
 * a new build-bro-api migration adds) would keep the rows tests create, and a later test would see them.
 */
async function assertEmptiesAllTables(connection: Connection, sql: string): Promise<void> {
  const rows: {name: string}[] = await connection.query(
    `select table_name as name
     from information_schema.tables
     where table_schema = database()
       and table_type = 'BASE TABLE'
       and table_name <> 'flyway_schema_history'`,
  )
  const emptied = deletedTables(sql)
  const missing = rows.map(row => row.name).filter(name => !emptied.has(name.toLowerCase())).sort()
  if (missing.length > 0) {
    throw new Error(`testdata.sql doesn't empty: ${missing.join(', ')}. Add a delete for each, in FK-safe order.`)
  }
}

/** The tables the script's `delete from <table>` statements empty, in lower case, ignoring `--` comments. */
function deletedTables(sql: string): Set<string> {
  const withoutComments = sql.replace(/--.*$/gm, '')
  const tables = [...withoutComments.matchAll(/\bdelete\s+from\s+`?(\w+)`?/gi)].map(match => match[1].toLowerCase())
  return new Set(tables)
}
