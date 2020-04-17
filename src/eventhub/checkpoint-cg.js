require('localsettings').config()
const { EventHubConsumerClient } = require('@azure/event-hubs')
const { ContainerClient } = require('@azure/storage-blob')
const { BlobCheckpointStore } = require('@azure/eventhubs-checkpointstore-blob')

const connectionString = process.env.EVENTHUB_CONNECTION
const eventHubName = ''
const storageConnectionString = ''
const containerName = 'azure-webjobs-??'
const consumerGroup = ''

async function main () {
  // this client will be used by our eventhubs-checkpointstore-blob, which
  // persists any checkpoints from this session in Azure Storage
  const containerClient = new ContainerClient(storageConnectionString, containerName)

  if (!containerClient.exists()) {
    await containerClient.create()
  }

  const checkpointStore = new BlobCheckpointStore(containerClient)

  const consumerClient = new EventHubConsumerClient(
    consumerGroup,
    connectionString,
    eventHubName,
    checkpointStore
  )

  const subscription = consumerClient.subscribe({
    processEvents: async (events, context) => {
      for (const event of events) {
        console.log(
          `Received event: '${event.body.event_time}' from partition: '${context.partitionId}' and consumer group: '${context.consumerGroup}'`
        )
      }

      try {
        // save a checkpoint for the last event now that we've processed this batch.
        await context.updateCheckpoint(events[events.length - 1])
      } catch (err) {
        console.log(`Error when checkpointing on partition ${context.partitionId}: `, err)
        throw err
      }

      console.log(
        `Successfully checkpointed event with sequence number: ${
          events[events.length - 1].sequenceNumber
        } from partition: ${context.partitionId}`
      )
    },
    processError: async (err, context) => {
      console.log(`Error : ${err}`)
    }
  })

  // after 30 seconds, stop processing
  await new Promise((resolve) => {
    setTimeout(async () => {
      await subscription.close()
      await consumerClient.close()
      resolve()
    }, 3000)
  })
}

main().catch((err) => {
  console.log('Error occurred: ', err)
})
