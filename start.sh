#!/bin/bash

###########################################################################################
# A script to build and run the Serverless API using HTTPS locally using Serverless Offline
###########################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Ensure that the development configuration is used
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
# Call a shared script to do the work
#
./run_api.sh
