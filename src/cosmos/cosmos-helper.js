const CosmosClient = require('@azure/cosmos').CosmosClient
const connection = process.env.COSMOS_CONNECTION
const cosmosClient = new CosmosClient(connection)

/**
 * @param {object} doc
 */
function upsert (doc, db, container) {
  return cosmosClient.database(db).container(container)
    .items.upsert(doc, { preTriggerInclude: 'triggerName' })
}

/**
 * @param {object} doc
 * @param {string} container
 */
function upsertContainer (doc, container, db) {
  return cosmosClient.database(db).container(container)
    .items.upsert(doc)
}

/**
 * @param {string} sql
 * @param {string} container
 */
function queryContainer (sql, container, db) {
  return cosmosClient.database(db).container(container).items.query(sql).fetchAll()
}

/**
 *
 * @param {string} id
 * @param {string} partKey
 * @param {string} containerKey
 * @param {string} [db]
 */
function getItem (id, partKey, containerKey, db) {
  const itemId = id.toString()
  const item = cosmosClient.database(db).container(containerKey).item(itemId, partKey)
  return item.read()
}

function deletItem (id, partKey, containerKey, db) {
  const itemId = id.toString()
  const item = cosmosClient.database(db).container(containerKey).item(itemId, partKey)
  return item.delete()
}

function findDocument (id, container) {
  const sqlSpec = {
    query: 'select * from c where c.id = @id',
    parameters: [{ name: '@id', value: id }]
  }
  return queryContainer(sqlSpec, container)
}


module.exports = {
  db: {
    upsert,
    upsertContainer,
    queryContainer,
    getItem,
    deletItem,
    findDocument
  }
}
