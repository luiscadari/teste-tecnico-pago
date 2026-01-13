const AWS = require("aws-sdk");

const sqs = new AWS.SQS({
  endpoint: "http://elasticmq:9324",
  accessKeyId: "na",
  secretAccessKey: "na",
  region: "us-east-1",
});

async function createQueueIfNotExists() {
  const queueName = process.env.QUEUE_NAME || "cep-requests";

  try {
    // Tenta obter a URL da fila (para verificar se existe)
    const data = await sqs.getQueueUrl({ QueueName: queueName }).promise();
    console.log(`Fila já existe: ${data.QueueUrl}`);
    process.env.QUEUE_URL = data.QueueUrl;
  } catch (error) {
    if (error.code === "AWS.SimpleQueueService.NonExistentQueue") {
      // Se não existir, cria a fila
      console.log(`Criando fila: ${queueName}`);

      const params = {
        QueueName: queueName,
        Attributes: {
          DelaySeconds: "0",
          MessageRetentionPeriod: "345600", // 4 dias
          VisibilityTimeout: "30",
          ReceiveMessageWaitTimeSeconds: "0",
        },
      };

      const data = await sqs.createQueue(params).promise();
      console.log(`Fila criada com sucesso: ${data.QueueUrl}`);
      process.env.QUEUE_URL = data.QueueUrl;
    } else {
      throw error;
    }
  }
}

module.exports = { sqs, createQueueIfNotExists };
