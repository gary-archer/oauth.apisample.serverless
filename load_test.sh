#!/bin/bash

###########################################################
# A script to run the load test after configuring SSL trust
###########################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Tell Node.js to trust the CA, or the user can add this CA to their own trust file
#
if [ "$NODE_EXTRA_CA_CERTS" == '' ]; then
  export NODE_EXTRA_CA_CERTS='./certs/authsamples-dev.ca.crt'
fi

#
# Run the load test
#
./node_modules/.bin/mocha ./test/loadTest.ts
