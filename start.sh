#!/bin/bash

###########################################################################################
# A script to build and run the Serverless API using HTTPS locally using Serverless Offline
###########################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Ensure that the development configuration is used that points to AWS Cognito
# You can then run a frontend locally that calls the Serverless API
#
cp environments/dev.config.json ./api.config.json

#
# Create SSL certificates if required
#
./certs/create.sh
if [ $? -ne 0 ]; then
  exit 1
fi

#
# Tell Node.js to trust the CA, or the user can add this CA to their own trust file
#
if [ "$NODE_EXTRA_CA_CERTS" == '' ]; then
  export NODE_EXTRA_CA_CERTS='./certs/authsamples-dev.ca.crt'
fi

#
# Call a shared script to do the work of running the API
#
./run_api.sh
if [ $? -ne 0 ]; then
  exit 1
fi
