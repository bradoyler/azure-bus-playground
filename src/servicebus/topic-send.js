require('dotenv').config() // loads ENV vars from local.settings.json
const { ServiceBusClient } = require('@azure/service-bus')
const connectionString = process.env.BUS_CONNECTION
const topicName = process.env.TOPIC_A_NAME

async function send (eventCount = 1) {
  const sbClient = ServiceBusClient.createFromConnectionString(connectionString)
  const client = sbClient.createTopicClient(topicName)
  const sender = client.createSender()

  const events = Array.from(Array(eventCount).keys())
  console.log('## created events:', eventCount, events)

  for (const num of events) {
    const msg = {
      label: 'TEST', // similar to SNS/AMQP subject
      userProperties: {
        priority: 1
      },
      body: { id: num, ts: new Date() }
      // messageId: '', // for deduping
      // sessionId: '', // for grouping
    }
    await sender.send(msg)
    console.log('>> sent:', msg)
  }

  await sender.close()
  await sbClient.close()
}

// poor man cli
// console.log('>>', process.argv)
const eventCount = Number(process.argv[2])
send(eventCount)
