const cepService = require("../services/cep.services");
const sqsService = require("../services/queue.services");

class Cep {
  async crawler(req, res) {
    const { cep_start, cep_end } =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!cep_start || !cep_end) {
      return res.status(400).send("cep_start and cep_end are required");
    }
    if (cep_start.length !== 8 || cep_end.length !== 8) {
      return res
        .status(400)
        .send("cep_start and cep_end must be 8 characters long");
    }
    if (cep_start > cep_end) {
      return res
        .status(400)
        .send("cep_start must be less than or equal to cep_end");
    }
    const crawl = await cepService.crawler(cep_start, cep_end);
    res.status(200).send({ crawlerId: crawl.crawlerId });

    setImmediate(() => {
      sqsService.processMessages().catch((err) => {
        console.error("Error processing messages:", err);
      });
    });
  }
  async getStatus(req, res) {
    const { id } = req.params;
    if (!id) {
      return res.status(400).send("id is required");
    }
    try {
      const status = await cepService.getStatus(id);
      if (!status) {
        return res.status(404).send("Crawl not found");
      }
      return res.status(200).json(status);
    } catch (e) {
      console.error("Error getting status", e);
      return res.status(500).send("Internal server error");
    }
  }
  async getResults(req, res) {
    const { id } = req.params;
    if (!id) {
      return res.status(400).send("id is required");
    }
    try {
      const results = await cepService.getResult(id);
      if (!results) {
        return res.status(404).send("Crawl not found");
      }
      return res.status(200).json(results);
    } catch (e) {
      console.error("Error getting results", e);
      return res.status(500).send("Internal server error");
    }
  }
}

module.exports = new Cep();
