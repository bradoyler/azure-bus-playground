require('dotenv').config() // loads ENV vars from local.settings.json
const { ServiceBusClient, ReceiveMode, delay } = require('@azure/service-bus')
const connectionString = process.env.BUS_CONNECTION
const topicName = process.env.TOPIC_A_NAME
const subscriptionName = process.env.SUBSCRIPTION_A1_NAME

async function listen (timeoutSecs) {
  console.log(`Opening stream for ${timeoutSecs} secs...`)
  const sbClient = ServiceBusClient.createFromConnectionString(connectionString)
  // NOTE: idea here is to create a test subscription that has a 'label=TEST' filter
  const subscriptionClient = sbClient.createSubscriptionClient(topicName, subscriptionName)
  const receiver = subscriptionClient.createReceiver(ReceiveMode.PeekLock)

  const onMessageHandler = async (message) => {
    const { body, label, messageId, userProperties } = message
    console.log('Received message:', { body, label, messageId, userProperties })
    await message.complete() // optional: depends on whether you want to dequeue message
  }
  const onErrorHandler = (err) => {
    console.log('Error occurred: ', err)
  }

  try {
    receiver.registerMessageHandler(onMessageHandler, onErrorHandler, {
      autoComplete: false
    })

    await delay(timeoutSecs * 1000)
    console.log('closing connection...')
    await receiver.close()
    await subscriptionClient.close()
  } finally {
    await sbClient.close()
  }
}

const timeoutSecs = Number(process.argv[2]) || 2
listen(timeoutSecs)
