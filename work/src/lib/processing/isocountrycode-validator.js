'use strict';

function isValidISOCountryCodeFormat(ISOCountryCode) {
  var regEx = /^[A-Z]{3}$/;
 
  return ISOCountryCode.match(regEx);
}

module.exports = isValidISOCountryCodeFormat;