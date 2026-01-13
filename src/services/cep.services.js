const crowlerSchema = require("../schemas/crawler.schema");
const queueServices = require("./queue.services");
const axios = require("axios");

class CepServices {
  async crawler(cep_start, cep_end) {
    const newCrawl = new crowlerSchema({ cep_start, cep_end });
    newCrawl.save();
    for (let cep = parseInt(cep_start); cep <= parseInt(cep_end); cep++) {
      try {
        await queueServices.addToQueue({
          cep: cep.toString().padStart(8, "0"),
          crawlerId: newCrawl._id,
        });
      } catch (e) {
        console.error("Error adding CEP to queue", e);
        throw e;
      }
    }
    return { crawlerId: newCrawl._id };
  }
  async getStatus(crawlId) {
    const crawl = await crowlerSchema.findById(crawlId);
    if (!crawl) {
      return null;
    }
    const respBody = {
      total: parseInt(crawl.cep_end) - parseInt(crawl.cep_start) + 1,
      processed: crawl.cep_range.length,
      successful: crawl.cep_range.filter((item) => !item.error).length,
      failed: crawl.cep_range.filter((item) => item.error).length,
      status: crawl.status,
    };
    return respBody;
  }
  async getResult(crawlId) {
    const crawl = await crowlerSchema.findById(crawlId);
    if (!crawl) {
      return null;
    }
    return crawl.cep_range;
  }
  async postCep(crawlId, cep) {
    const crawl = await crowlerSchema.findById(crawlId);
    if (!crawl) {
      throw new Error("Crawl not found");
    }
    let response;
    try {
      response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    } catch (e) {
      console.error("Error fetching CEP data", e);
      crawl.cep_range.push({ cep, error: "invalid CEP" });
      await crawl.save();
    }
    if (!response.data || response.data.erro) {
      crawl.cep_range.push({ cep, error: "CEP not found" });
    } else {
      crawl.cep_range.push(response.data);
    }
    await crawl.save();
    return { success: true };
  }
}

module.exports = new CepServices();
