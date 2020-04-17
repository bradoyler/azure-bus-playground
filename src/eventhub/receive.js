const { EventHubConsumerClient, earliestEventPosition } = require('@azure/event-hubs')

// Load the .env file if it exists
require('dotenv').config()

const connectionString = process.env.EVENTHUB_CONNECTION
const eventHubName = process.env.EVENTHUB_NAME
const consumerGroup = process.env.EVENTHUB_CONSUMERGROUP || 'test-cg'

async function main () {
  console.log('started receiveEvents example')

  const consumerClient = new EventHubConsumerClient(consumerGroup, connectionString, eventHubName)

  const subscription = consumerClient.subscribe(
    {
      // The callback where you add your code to process incoming events
      processEvents: async (events, context) => {
        // context.updateCheckpoint()
        console.log('######')

        for (const event of events) {
          console.log(
            `Received event: '${event.body.event_time}' from partition: '${context.partitionId}' and consumer group: '${context.consumerGroup}'`
          )
        }
      },
      processError: async (err, context) => {
        console.log(`Error : ${err}`)
      }
    },
    { startPosition: earliestEventPosition }
  )

  // Wait for a bit before cleaning up the sample
  setTimeout(async () => {
    await subscription.close()
    await consumerClient.close()
    console.log('Exiting receiveEvents sample')
  }, 30 * 1000)
}

main().catch((error) => {
  console.error('Error running sample:', error)
})
