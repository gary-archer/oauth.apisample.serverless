#!/bin/bash

##########################################
# A shared script to build and run the API
##########################################

cd "$(dirname "${BASH_SOURCE[0]}")"
SLS='./node_modules/.bin/sls'

#
# Install dependencies if needed
#
npm install
if [ $? -ne 0 ]; then
  echo 'Problem encountered installing dependencies'
  read -n 1
  exit 1
fi

#
# Enforce code quality checks
#
npm run lint
if [ $? -ne 0 ]; then
  echo 'Code quality checks failed'
  read -n 1
  exit 1
fi

#
# Run webpack to build the API code into bundles
#
NODE_OPTIONS='--import tsx' npx webpack --config webpack/webpack.config.dev.ts
if [ $? -ne 0 ]; then
  echo 'Problem encountered building the API code'
  read -n 1
  exit 1
fi

#
# Run Serverless offline to expose lambda endpoints at HTTPS endpoints
#
npx sls offline \
  --config ./serverless.yml \
  --useInProcess \
  --noPrependStageInUrl \
  --noSponsor \
  --prefix 'investments' \
  --host '0.0.0.0' \
  --httpPort 446 \
  --httpsProtocol certs
if [ $? -ne 0 ]; then
  echo 'Problem encountered starting Serverless Offline'
  read -n 1
  exit 1
fi
