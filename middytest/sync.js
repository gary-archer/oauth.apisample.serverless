const middy = require('middy')

const originalHandler = ((event, context, callback) => {
    console.log( 'Running business handler');
    callback(null, {businessResult: '42'});
});

const authorizeMiddleware = () => {
  return {
    before: (h, next) => {
      console.log('Running authorize middleware');

      // h.callback(null, {result: 'unauthorized'});
      return next();
    }
  }
}

const handler = middy(originalHandler)
  .use(authorizeMiddleware());

module.exports = { handler };