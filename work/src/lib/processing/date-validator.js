'use strict';

function isValidDateFormat(dateString) {
  var regEx = /^\d{4}[-]\d{2}[-]\d{2}T\d{2}:\d{2}:\d{2}Z$/;
  
  if(!dateString.match(regEx)) return false;  // Invalid format
  
  var d = new Date(dateString);
  
  if(!d.getTime() && d.getTime() !== 0) return false; // Invalid date
  
  return d.toISOString().slice(0,19)+'Z' === dateString;
}

module.exports = isValidDateFormat;