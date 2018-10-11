'use strict';

const Operation = require('./lib/operation');
const Logger = require('./lib/logging');
const ImageMetadataDownloader = require('./lib/processing/image-metadata-downloader');

const productImagesUrls = process.env.PRODUCT_IMAGES_URLS ?
  JSON.parse(process.env.PRODUCT_IMAGES_URLS) :
  {
    "lk": "https://s3.amazonaws.com/loungekey-web/logos/DMC/Lounge_Key_Logo_RGB.jpg",
    "pp": "https://s3-eu-west-1.amazonaws.com/ptg-web/logos/DMC/PP_Ochre_Charcoal_landscape_logo.jpg"
  };

const productImageMetadataCache = {}

module.exports = class extends Operation {
  constructor(consumerApi) {
    super();
    this._consumerApi = consumerApi;
  }

  async process(membershipNumber) {
    const membershipNumberLookupResponse = await this._consumerApi.lookupMembershipNumber(membershipNumber, this.lookupMembershipNumberErrorMapper);
    Logger.debug('membership number lookup response: ' + JSON.stringify(membershipNumberLookupResponse && membershipNumberLookupResponse.data));
    const consumerNumber = membershipNumberLookupResponse && membershipNumberLookupResponse.data && membershipNumberLookupResponse.data.ConsumerNumber;

    const consumerConfigResponse = await this._consumerApi.getConsumerConfig(membershipNumberLookupResponse.data.ProductCode, consumerNumber, this.getConsumerConfigErrorMapper);
    Logger.debug('consumer config response: ' + JSON.stringify(consumerConfigResponse && consumerConfigResponse.data));

    const consumerProductCode = membershipNumberLookupResponse.data.ProductCode.toLowerCase();
    const productImageUrl = productImagesUrls[consumerProductCode];

    let imageMetadata;
    if (consumerProductCode in productImageMetadataCache) {
      // Retrieve data cached troughout Lambda lifetime.
      imageMetadata = productImageMetadataCache[consumerProductCode];
    }
    else {
      imageMetadata = await this.getImageMetadata(productImageUrl);
      productImageMetadataCache[consumerProductCode] = imageMetadata;
    }

    const response = this.generateResponse(consumerConfigResponse, imageMetadata, consumerProductCode);

    return this.okResponse(response);
  }

  lookupMembershipNumberErrorMapper(lbapiError) {
    if (lbapiError.statusCode === 404) {
      lbapiError.errorCode = 'parameter.value.membershipNumber';
      lbapiError.message = 'The membership number was not found';
    }
    return lbapiError;
  }

  getConsumerConfigErrorMapper(lbapiError) {
    if (lbapiError.statusCode === 404) {
      Logger.debug("Consumer number was returned from LB API, but config was not found!");
      lbapiError.statusCode = 500;
      lbapiError.errorCode = 'internal_server_error';
      lbapiError.message = 'Internal Server Error';
    }
    return lbapiError;
  }

  async getImageMetadata(imageUrl) {
    const lastModifiedIsoDateTime = await ImageMetadataDownloader.getImageLastModifiedIsoDate(imageUrl);
    const imageDimensions = await ImageMetadataDownloader.getImageDimensions(imageUrl);

    return ({
      lastModified: lastModifiedIsoDateTime,
      imageWidth: imageDimensions.width,
      imageHeight: imageDimensions.height,
      imageUrl: imageUrl
    });
  }

  generateResponse(consumerNumberResponse, imageMetadata, productCode) {
    const response = {
      data: this.generateResponseBody(consumerNumberResponse, imageMetadata, productCode),
      headers: {
        "ImageURL": imageMetadata.imageUrl
      }
    };

    return response;
  }

  generateResponseBody(consumerConfigResponse, imageMetadata, productCode) {
    const response = {
      "IsDMCAvailable": consumerConfigResponse.data.IsDMCAvailable,
      "DMC": {
        "MembershipNumber": consumerConfigResponse.data.MembershipNumber,
        "CardholderName": consumerConfigResponse.data.CardholderName,
        "CardOnFile": this.getCardOnFile(consumerConfigResponse.data.ObfuscatedPan),
        "ExpiryDate": consumerConfigResponse.data.MembershipExpiry.concat('Z'),
        "CreationDate": consumerConfigResponse.data.MembershipCreation.concat('Z'),
        "Barcode": consumerConfigResponse.data.CurrentDMCBarcode || ''
      },
      "Media": [
        this.getMediaContent(imageMetadata, productCode)
      ]
    };

    return response;
  }

  getCardOnFile(obfuscatedPan) {
    if (obfuscatedPan && obfuscatedPan.length > 3) {
      return obfuscatedPan.substring(obfuscatedPan.length - 4);
    }

    return obfuscatedPan;
  }

  getMediaContent(imageMetadata, productCode) {
    return {
      Width: imageMetadata.imageWidth,
      Height: imageMetadata.imageHeight,
      MimeType: "image/jpeg",
      URL: imageMetadata.imageUrl,
      Description: productCode.toUpperCase().concat(' logo'),
      LastModified: imageMetadata.lastModified
    };
  }
}