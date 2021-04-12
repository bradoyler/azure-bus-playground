require('dotenv').config()
const { ServiceBusClient, ReceiveMode, QueueClient, TopicClient } = require('@azure/service-bus')

const entityType = process.env.ENTITY_TYPE || 'topic' // or 'queue'
const connectionString = process.env.SERVICEBUS_CONNECTION_STRING || '<connection string>'
const entityName = process.env.ENTITY_NAME || '<topic/queue name>'
const subscriptionName = process.env.SUBSCRIPTION_NAME

const sbClient = ServiceBusClient.createFromConnectionString(connectionString)

let msgCounter = 0

const onMessageHandler = async (message) => {
  const { enqueuedTimeUtc } = message
  process.stdout.clearLine()
  process.stdout.cursorTo(0)
  msgCounter++
  process.stdout.write(`Receiving ${entityType} stream: ${entityName} # ${msgCounter}: ${enqueuedTimeUtc}`)
}
const onErrorHandler = (err) => {
  console.log('Error occurred: ', err)
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

  receiver.registerMessageHandler(onMessageHandler, onErrorHandler, {
    maxConcurrentCalls: 40, // for more throughput
    autoComplete: true // dequeues the message automatically
  })
}

receiveDeadletters().catch((err) => {
  console.log('### Error:', err)
  process.exit(1)
})
