'use strict';

function isValidEmailFormat(emailString) {
  var regEx = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
 
  return emailString.match(regEx);

}

module.exports = isValidEmailFormat;