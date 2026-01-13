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
      : 10;
    // Delay em milissegundos entre cada requisição (padrão: 1 segundo)
    const delayBetweenRequests = process.env.REQUEST_DELAY_MS
      ? parseInt(process.env.REQUEST_DELAY_MS)
      : 1000;

    let crawler = null;
    let hasMessages = true;

    try {
      // Loop contínuo processando mensagens até a fila estar vazia
      while (hasMessages) {
        const data = await sqs
          .receiveMessage({
            MaxNumberOfMessages: maxNumberOfMessages,
            QueueUrl: process.env.QUEUE_URL,
            WaitTimeSeconds: 2,
          })
          .promise();

        if (data.Messages === undefined || data.Messages.length === 0) {
          hasMessages = false;
          console.log("Nenhuma mensagem restante na fila");
          break;
        }

        // Atualiza status do crawler apenas na primeira vez
        if (!crawler && data.Messages[0]) {
          crawler = await crawlerSchema.findById(
            JSON.parse(data.Messages[0].Body).crawlerId
          );
          if (crawler) {
            crawler.status = "processing";
            await crawler.save();
          }
        }

        for (let i = 0; i < data.Messages.length; i++) {
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

        // Pequeno delay entre lotes para não sobrecarregar
        await this.sleep(process.env.REQUEST_DELAY_MS || 5000);
      }

      // Atualiza status final do crawler
      if (crawler) {
        crawler = await crawlerSchema.findById(crawler._id);
        const totalExpected =
          parseInt(crawler.cep_end) - parseInt(crawler.cep_start);
        const totalProcessed = crawler.cep_range.length;
        console.log(
          `Crawl ${crawler._id} - Expected: ${totalExpected}, Processed: ${totalProcessed}`
        );

        if (totalExpected + 1 === totalProcessed) {
          crawler.status = "finished";
        } else {
          crawler.status = "failed";
        }
        await crawler.save();
      }

      return { success: true, message: "Todas as mensagens foram processadas" };
    } catch (e) {
      console.error("Error processing messages from queue", e);
      console.log(e.message);

      // Marca crawler como failed em caso de erro
      if (crawler) {
        crawler.status = "failed";
        await crawler.save();
      }
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
