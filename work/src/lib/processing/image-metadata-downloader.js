'use strict';
const request = require('request-promise-native');
const requestImageSize = require('request-image-size');
const moment = require('moment');

const Logger = require('../logging');
const { ServerError } = require('../exceptions/errors');

async function getImageLastModifiedIsoDate(imageUrl) {
  let response;
  try {
    response = await request({
      method: 'HEAD',
      uri: imageUrl,
      resolveWithFullResponse: true
    });
  }
  catch (error) {
    Logger.debug(`error while trying to send HEAD request to ${imageUrl}: ${error}`);
    throw new ServerError({
      message: "An unexpected problem occurred in the API",
      details: `error while trying to send HEAD request to ${imageUrl}`
    });
  }

  const lastModified = response.headers['last-modified'];
  return moment(lastModified).format(moment.defaultFormatUtc);
}

async function getImageDimensions(imageUrl) {
  let imageDimensions = {};
  try {
    let imageSizeResponse = await requestImageSize(imageUrl);
    imageDimensions.width = imageSizeResponse.width;
    imageDimensions.height = imageSizeResponse.height;
  }
  catch (error) {
    Logger.debug(`error while obtaining size of image: ${error}`);
    throw new ServerError({
      message: "An unexpected problem occurred in the API",
      details: "error while obtaining size of image"
    });
  }

  return imageDimensions;
}

module.exports = { getImageLastModifiedIsoDate, getImageDimensions };