// todo
require('dotenv').config() // loads ENV vars from .env file
const { ServiceBusClient } = require('@azure/service-bus')
const connectionString = process.env.BUS_CONNECTION
const topicName = process.env.TOPIC_A_NAME
const subscriptionName = process.env.SUBSCRIPTION_A1_NAME
const sbClient = ServiceBusClient.createFromConnectionString(connectionString)

async function main () {
  try {
    await addRules(sbClient)
  } finally {
    await sbClient.close()
  }
}

async function addRules (sbClient) {
  const subClient = sbClient.createSubscriptionClient(topicName, subscriptionName)
  // The default rule on the subscription allows all messages in.
  // So, remove existing rules before adding new ones
  await removeAllRules(subClient)
  console.log('removed all filters')
  await subClient.addRule('label-filter', { label: 'TEST' })
  await subClient.addRule('Priority-1', 'priority = 1')
  console.log('add 2 filters')
}

async function removeAllRules (client) {
  const rules = await client.getRules()
  for (let i = 0; i < rules.length; i++) {
    await client.removeRule(rules[i].name)
  }
}

main().catch((err) => {
  console.log('Error occurred: ', err)
})
