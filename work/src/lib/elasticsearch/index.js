'use strict';

const elasticsearch = require('elasticsearch');
const logger = require('../logging');
module.exports = class {
  constructor() {
    this._indexName = process.env.IndexName || 'lounge';
    this._indexType = '_doc';

    this._esclient = new elasticsearch.Client({
      host: process.env.ESDomain || '127.0.0.1:9200'
    });
  }

  async search(query, index) {
    const esParameters = {
      index: `${this._indexName}_${index}`,
      type: this._indexType,
      body: query,
      size: 10000
    };

    logger.time('elastic search');

    const response = await this._esclient.search(esParameters); 

    logger.timeEnd('elastic search');

    return response.hits.hits.map(x => ({data: x._source.Data, id: x._id}));;
  } 
}
