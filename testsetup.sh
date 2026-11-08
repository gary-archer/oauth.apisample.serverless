#!/bin/bash

##########################################################################
# A script to run the API with Serverless Offline and a test configuration
##########################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Copy down the test configuration, to point the API to a mock authorization server
#
cp environments/test.config.json ./api.config.json

#
# Create SSL certificates if required
#
./certs/create.sh
if [ $? -ne 0 ]; then
  exit 1
fi

#
# Call a shared script to run the API
#
./run_api.sh

#
# Indicate success
#
echo "Start tests via './integration_tests.sh' or './load_test.sh' ..."
