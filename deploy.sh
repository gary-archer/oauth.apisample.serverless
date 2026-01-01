#!/bin/bash

###################################################
# A script to package and deploy the lambdas to AWS
###################################################

cd "$(dirname "${BASH_SOURCE[0]}")"
SLS='./node_modules/.bin/sls'

#
# Copy down the deployed configuration
#
cp ./environments/deployed.config.json ./api.config.json

#
# Install dependencies if needed
#
npm install
if [ $? -ne 0 ]; then
  echo 'Problem encountered installing API dependencies'
  exit 1
fi

#
# Do a release build of the API code
#
NODE_OPTIONS='--import tsx' npx webpack --config webpack/webpack.config.prod.ts
if [ $? -ne 0 ]; then
  echo 'Problem encountered building the API code'
  read -n 1
  exit 1
fi

echo 'quitting early'
exit 1

#
# Do the Serverless packaging
#
rm -rf ./.serverless
"$SLS" package --stage deployed
if [ $? -ne 0 ]; then
  echo 'Problem encountered packaging the API'
  exit 1
fi

#
# Do the Serverless deployment
#
"$SLS" deploy --stage deployed --package .serverless
if [ $? -ne 0 ]; then
  echo 'Problem encountered packaging the API'
  exit
fi

#
# Replace the development configuration on success
#
cp ./environments/dev.config.json ./api.config.json
