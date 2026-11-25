import {readFile} from 'node:fs/promises'
import {test as setup} from '@playwright/test'
import mariadb from 'mariadb'
import {env} from '../support/env'

// Brings the API's database to a known state: build-bro-api's testdata.sql deletes all rows and
// inserts the test data. The tests can rely on exactly that data.
setup('reset the database to testdata.sql', async () => {
  setup.skip(!env.resetDb, 'RESET_DB=false')

  const sql = await readFile(env.testDataSql, 'utf8')
  const connection = await mariadb.createConnection({...env.db, multipleStatements: true})
  try {
    await connection.query(sql)
  } finally {
    await connection.end()
  }
})
