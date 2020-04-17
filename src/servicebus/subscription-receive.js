require('dotenv').config() // loads ENV vars from local.settings.json
const { ServiceBusClient, ReceiveMode } = require('@azure/service-bus')
const connectionString = process.env.BUS_CONNECTION
const topicName = process.env.TOPIC_A_NAME
const subscriptionName = process.env.SUBSCRIPTION_A1_NAME

async function listen (maxMessageCount, maxWaitTimeInSeconds = 2) {
  const sbClient = ServiceBusClient.createFromConnectionString(connectionString)
  // NOTE: idea here is to create a test subscription that has a 'label=TEST' filter
  const subscriptionClient = sbClient.createSubscriptionClient(topicName, subscriptionName)
  const receiver = subscriptionClient.createReceiver(ReceiveMode.receiveAndDelete)

  try {
    // this receiver will trigger after 5 messages or 5 seconds
    const messages = await receiver.receiveMessages(maxMessageCount, maxWaitTimeInSeconds)
    console.log('>> received:', messages.map(({ body, label, messageId }) => ({ body, label, messageId })))

    await subscriptionClient.close()
  } finally {
    await sbClient.close()
  }
}

const count = Number(process.argv[2]) || 1
listen(count)
