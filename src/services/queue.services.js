const { sqs } = require("../config/sqsClient");
const crawlerSchema = require("../schemas/crawler.schema");

class QueueServices {
  // Helper para adicionar delay entre requisições
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async addToQueue({ cep, crawlerId }) {
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
    const cepServices = require("./cep.services");
    const maxNumberOfMessages = process.env.MAX_NUMBER_OF_MESSAGES
      ? parseInt(process.env.MAX_NUMBER_OF_MESSAGES)
      : 15;
    // Delay em milissegundos entre cada requisição (padrão: 1 segundo)
    const delayBetweenRequests = process.env.REQUEST_DELAY_MS
      ? parseInt(process.env.REQUEST_DELAY_MS)
      : 1000;

    try {
      const data = await sqs
        .receiveMessage({
          MaxNumberOfMessages: 50,
          QueueUrl: process.env.QUEUE_URL,
          WaitTimeSeconds: 2,
        })
        .promise();
      const crawler = await crawlerSchema.findById(
        data.Messages[0] ? JSON.parse(data.Messages[0].Body).crawlerId : null
      );
      crawler.status = "processing";
      await crawler.save();
      if (data.Messages === undefined || data.Messages.length === 0) {
        return { success: true, message: "No messages to process" };
      }
      for (let i = 0; i < data.Messages.length; i++) {
        if (i >= maxNumberOfMessages) {
          break;
        }
        const message = data.Messages[i];
        console.log("Processing message:", message.Body);
        const parsedBody = JSON.parse(message.Body);
        const cepData = {
          cep: parsedBody.cep,
          crawlerId: parsedBody.crawlerId,
        };
        await cepServices.postCep(cepData.crawlerId, cepData.cep);
        await this.deleteMessage(message.ReceiptHandle);

        // Adiciona delay entre requisições (exceto após a última)
        if (i < data.Messages.length - 1) {
          await this.sleep(delayBetweenRequests);
        }
      }

      if (crawler) {
        if (
          parseInt(crawler.cep_end) - parseInt(crawler.cep_start) ===
          crawler.cep_range.length + 1
        ) {
          crawler.status = "finished";
          await crawler.save();
        } else {
          crawler.status = "failed";
          await crawler.save();
        }
      }
    } catch (e) {
      console.error("Error processing messages from queue", e);
      console.log(e.message);
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
