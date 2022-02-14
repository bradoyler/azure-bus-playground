const { EventHubProducerClient } = require('@azure/event-hubs')

// sample from Msft: https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/eventhub/event-hubs/samples/v5/javascript/sendEvents.js

// Load the .env file if it exists
require('dotenv').config()

const connectionString = process.env.EVENTHUB_CONNECTION
const eventHubName = process.env.EVENTHUB_NAME

async function main () {
  console.log('started sendBatch example')

  const producer = new EventHubProducerClient(connectionString, eventHubName)
  const batchOptions = {}
  const batch = await producer.createBatch(batchOptions)
  console.log('batch created')
  batch.tryAdd({ body: 'TEST111 ' })
  batch.tryAdd({ body: 'TEST222' })
  console.log('added to batch')
  await producer.sendBatch(batch)
  console.log('sendBatch completed')

  // Wait for a bit before cleaning up the sample
  setTimeout(async () => {
    await producer.close()
    console.log('Exiting sendBatch sample')
  }, 5 * 1000)
}

main().catch((error) => {
  console.error('Error running sample:', error)
})
