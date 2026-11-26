import {readFile} from 'node:fs/promises'
import mariadb, {type Connection} from 'mariadb'
import {env} from './env'

/** A connection to the API's database that can run testdata.sql in one query. */
export function connectToDatabase(): Promise<Connection> {
  return mariadb.createConnection({...env.db, multipleStatements: true})
}

let testData: Promise<string> | undefined

/**
 * Brings the API's database back to build-bro-api's testdata.sql: it deletes all rows and inserts the
 * test data with fixed IDs, so it can run again and again. AUTO_INCREMENT counters stay where they
 * are, so rows the API creates get unpredictable IDs.
 */
export async function resetDatabase(connection: Connection): Promise<void> {
  testData ??= readFile(env.testDataSql, 'utf8')
  await connection.query(await testData)
}
