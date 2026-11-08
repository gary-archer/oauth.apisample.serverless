#!/bin/bash

################################################################
# A script to run the suite of tests after configuring SSL trust
################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Tell Node.js to trust the development root CA
#
export NODE_EXTRA_CA_CERTS='./certs/authsamples-dev.ca.crt'

#
# Run the suite of integration tests
#
./node_modules/.bin/mocha ./test/integrationTests.ts
