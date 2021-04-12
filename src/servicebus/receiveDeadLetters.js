require('dotenv').config()
const { ServiceBusClient, ReceiveMode, QueueClient, TopicClient } = require('@azure/service-bus')

const entityType = process.env.ENTITY_TYPE || 'topic' // or 'queue'
const connectionString = process.env.SERVICEBUS_CONNECTION_STRING || '<connection string>'
const entityName = process.env.ENTITY_NAME || '<topic/queue name>'
const subscriptionName = process.env.SUBSCRIPTION_NAME
const dlReceiveSize = parseInt(process.env.DEADLETTER_RECEIVE_SIZE) || 2000

const sbClient = ServiceBusClient.createFromConnectionString(connectionString)

async function main () {
  try {
    await receiveDeadletters()
  } finally {
    await sbClient.close()
  }
}

async function receiveDeadletters () {
  let receiver
  let entityClient // either QueueClient or SubscriptionClient
  if (entityType === 'queue') {
    const deadLetterQueueName = QueueClient.getDeadLetterQueuePath(entityName)
    entityClient = sbClient.createQueueClient(deadLetterQueueName)
    receiver = entityClient.createReceiver(ReceiveMode.receiveAndDelete)
  } else if (entityType === 'topic' && subscriptionName) {
    const deadLetterQueueName = TopicClient.getDeadLetterTopicPath(entityName, subscriptionName)
    entityClient = sbClient.createSubscriptionClient(deadLetterQueueName)
    receiver = entityClient.createReceiver(ReceiveMode.receiveAndDelete)
  } else {
    return console.log(`You must set ${entityType} options`)
  }

  const messages = await receiver.receiveMessages(dlReceiveSize)

  if (messages.length > 0) {
    console.log(`## Rcvd ${messages.length} messages from ${entityName} ${entityType} DLQ:`, new Date(messages[0]._amqpMessage.creation_time))

    // Mark message as complete/processed. Only needed for peekLock ReceiveMode
    // await receiver.completeMessage(messages[0])
  } else {
    console.log('### Error: No messages were received from the DLQ.')
  }

  await entityClient.close()
}

main().catch((err) => {
  console.log('### Error:', err)
  process.exit(1)
})
