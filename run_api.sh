#!/bin/bash

##########################################
# A shared script to build and run the API
##########################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Install dependencies if needed
#
if [ ! -d 'node_modules' ]; then
  npm install
  if [ $? -ne 0 ]; then
    echo '*** Problem encountered installing dependencies'
    read -n 1
    exit 1
  fi
fi

#
# Enforce code quality checks
#
npm run lint
if [ $? -ne 0 ]; then
  echo '*** Code quality checks failed'
  read -n 1
  exit 1
fi

#
# Build code
#
npm run build
if [ $? -ne 0 ]; then
  echo '** Problem encountered building the API code'
  read -n 1
  exit 1
fi

#
# Run Serverless offline to expose lambda endpoints at HTTPS endpoints
#
npx sls offline \
  --useInProcess \
  --noPrependStageInUrl \
  --prefix 'investments' \
  --host api.authsamples-dev.com \
  --httpPort 446 \
  --httpsProtocol certs
if [ $? -ne 0 ]; then
  echo '** Problem encountered starting Serverless Offline'
  exit 1
fi

#
# Prevent automatic terminal closure if there is a startup error
#
read -n 1
