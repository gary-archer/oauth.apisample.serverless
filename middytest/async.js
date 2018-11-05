const middy = require('middy')

const originalHandler = (async (event, context) => {
    console.log( 'Running business handler');
    return {businessResult: '42'};
});

const authorizeMiddleware = () => {
  return {
    before: async (h, next) => {
      console.log('Running authorize middleware')
      
      // h.callback(null, {result: 'unauthorized'});
      return next();
    }
  }
}

const handler = middy(originalHandler)
  .use(authorizeMiddleware());

module.exports = { handler };