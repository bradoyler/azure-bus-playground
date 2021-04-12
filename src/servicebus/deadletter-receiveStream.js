require('dotenv').config()
const { ServiceBusClient, ReceiveMode, QueueClient, TopicClient } = require('@azure/service-bus')

const entityType = process.env.ENTITY_TYPE || 'topic' // or 'queue'
const connectionString = process.env.SERVICEBUS_CONNECTION_STRING || '<connection string>'
const entityName = process.env.ENTITY_NAME || '<topic/queue name>'
const subscriptionName = process.env.SUBSCRIPTION_NAME
const streamConcurrency = parseInt(process.env.STREAM_CONCURRENCY) || 60

const sbClient = ServiceBusClient.createFromConnectionString(connectionString)

let msgCounter = 0
let lastCount = 0
let enqueuedTimeUtc

const onMessageHandler = async (message) => {
  enqueuedTimeUtc = new Date(message.enqueuedTimeUtc)
  msgCounter++
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

  // interval Logger for better perf
  setInterval(() => {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
    const rate = (msgCounter - lastCount)
    process.stdout.write(`Receiving ${entityType} stream: ${entityName} # ${msgCounter}: ${enqueuedTimeUtc}, msgs/sec: ${rate}`)
    lastCount = msgCounter
  }, 1000)

  receiver.registerMessageHandler(onMessageHandler, onErrorHandler, {
    maxConcurrentCalls: streamConcurrency, // for more throughput
    autoComplete: true // dequeues the message automatically
  })
}

receiveDeadletters().catch((err) => {
  console.log('### Error:', err)
  process.exit(1)
})
