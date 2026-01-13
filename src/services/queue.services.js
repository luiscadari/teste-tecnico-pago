const sqs = require("../config/sqsClient");
const cepService = require("./cep.services");

class QueueServices {
  async addToQueue(cep, crawlerId) {
    const messageBody = { cep, crawlerId };
    const params = {
      MessageBody: JSON.stringify(messageBody),
      QueueUrl: process.env.QUEUE_URL,
    };
    try {
      await sqs.sendMessage(params).promise();
    } catch (e) {
      console.error("Error adding message to queue", e);
      throw e;
    }
    return { success: true };
  }

  async processMessages() {
    const params = {
      QueueUrl: process.env.QUEUE_URL,
      MaxNumberOfMessages: process.env.MAX_NUMBER_OF_MESSAGES
        ? parseInt(process.env.MAX_NUMBER_OF_MESSAGES)
        : 10,
    };
    try {
      const data = await sqs.receiveMessage(params).promise();
      if (data.Messages === undefined || data.Messages.length === 0) {
        return { success: true, message: "No messages to process" };
      }
      for (const message of data.Messages) {
        const cepData = {
          cep: JSON.parse(message.Body.cep),
          crawlerId: JSON.parse(message.Body.crawlerId),
        };
        await cepService.postCep(cepData.crawlerId, cepData.cep);
        await this.deleteMessage(message.ReceiptHandle);
      }
    } catch (e) {
      console.error("Error processing messages from queue", e);
      throw e;
    }
  }
  async deleteMessage(receiptHandle) {
    const params = {
      QueueUrl: process.env.QUEUE_URL,
      ReceiptHandle: receiptHandle,
    };
    try {
      await sqs.deleteMessage(params).promise();
    } catch (e) {
      console.error("Error deleting message from queue", e);
      throw e;
    }
    return { success: true };
  }
}

module.exports = new QueueServices();
