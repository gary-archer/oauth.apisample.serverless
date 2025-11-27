#!/bin/bash

######################################################################################################
# A script to create an SSL certificate in a secrets folder that can be used for multiple code samples
######################################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Do nothing if the required local files exist
#
if [ -f './authsamples-dev.ssl.p12' ] && [ -f './authsamples-dev.ssl.crt' ] && [ -f './cert/pem' ] && [ -f './key.pem' ]; then
  exit 0
fi

#
# Otherwise require an environment variable for a shared secrets folder
#
if [ "$SECRETS_FOLDER" == '' ]; then
  echo 'You must supply a SECRETS_FOLDER environment variable to the certificate creation script'
  exit 1
fi

if [ ! -d "$SECRETS_FOLDER" ]; then
  echo 'The SECRETS_FOLDER does not exist'
  exit 1
fi

#
# If certificates already exist for another code sample, copy them to the local folder
#
KEY_PATH="$SECRETS_FOLDER/authsamples-dev.ssl.key"
CERT_PATH="$SECRETS_FOLDER/authsamples-dev.ssl.crt"
P12_PATH="$SECRETS_FOLDER/authsamples-dev.ssl.p12"
ROOT_CA_PATH="$SECRETS_FOLDER/authsamples-dev.ca.crt"
if [ -f "$KEY_PATH" ] && [ -f "$CERT_PATH" ] && [ -f "$P12_PATH" ] && [ -f "$ROOT_CA_PATH" ]; then
  cp "$KEY_PATH" ./key.pem
  cp "$CERT_PATH" ./cert.pem
  cp "$P12_PATH" .
  cp "$ROOT_CA_PATH" .
  exit 0
fi

#
# Otherwise, create the certs in this folder
#
./makecerts.sh
if [ $? -ne 0 ]; then
  exit 1
fi

#
# Then copy certificate files to the secrets folder, to avoid recreation for other code samples
#
cp authsamples-dev* "$SECRETS_FOLDER"
