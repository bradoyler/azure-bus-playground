require('dotenv').config() // loads ENV vars from .env file
const { ServiceBusClient } = require('@azure/service-bus')
const connectionString = process.env.BUS_CONNECTION
const topicName = process.env.TOPIC_A_NAME
const subscriptionName = process.env.SUBSCRIPTION_A1_NAME

const sbClient = ServiceBusClient.createFromConnectionString(connectionString)
// NOTE: idea here is to create a test subscription that has a 'label=TEST' filter
const subscriptionClient = sbClient.createSubscriptionClient(topicName, subscriptionName)

async function browse (maxMessageCount) {
  try {
    // browse the top 5 message in queue
    const messages = await subscriptionClient.peek(maxMessageCount)
    console.log('>> browsing:', messages.map(({ body, label, messageId }) => ({ body, label, messageId })))
    await subscriptionClient.close()
  } catch (ex) {
    console.error('ERR:', ex)
  } finally {
    console.log('closing connection...')
    sbClient.close()
  }
}

const count = Number(process.argv[2]) || 1
browse(count)
