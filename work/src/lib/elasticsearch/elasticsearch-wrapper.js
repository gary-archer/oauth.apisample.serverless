'use strict';
const elasticSearch = require('../elasticsearch');
const { ValidationError } = require('../exceptions/errors');
module.exports = class {
  constructor() {}

  async getLounges(outletCodes, productCode, languageCode, optionalIncludeSection) {
    let includeSection;
    if (optionalIncludeSection) {
      includeSection = optionalIncludeSection;
      includeSection.push('Data.Lounge');
    } else {
      includeSection = ['Data.Lounge'];
    }

    const query = outletsQuery(outletCodes, includeSection);
    const index = `${productCode}_${languageCode}`.toLowerCase();
    const elastic = new elasticSearch();

    return await elastic.search(query, index);
  }
}

const outletsQuery = function(outletCodes, includeSection) {
  return JSON.stringify({  
    '_source':{  
       'include': includeSection
    },
    'query':{  
       'bool':{  
          'must':[  
             {  
                'constant_score':{  
                   'filter':{  
                      'multi_match':{  
                         'query': outletCodes,
                         'fields':'Data.LoungeCode'
                      }
                   }
                }
             }
          ]
       }
    }
 });
}