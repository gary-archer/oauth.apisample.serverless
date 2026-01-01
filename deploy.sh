#!/bin/bash

###################################################
# A script to package and deploy the lambdas to AWS
###################################################

cd "$(dirname "${BASH_SOURCE[0]}")"
SLS='./node_modules/.bin/sls'

#
# Install dependencies if needed
#
npm install
if [ $? -ne 0 ]; then
  echo 'Problem encountered installing API dependencies'
  exit 1
fi

#
# Enforce code quality checks
#
npm run lint
if [ $? -ne 0 ]; then
  echo 'Code quality checks failed'
  exit 1
fi

#
# Prepare the dist folder
#
rm -rf dist
mkdir dist
cp package*.json dist/
cd dist
npm install --omit=dev
cd ..

#
# Do a release build of the API code
#
NODE_OPTIONS='--import tsx' npx webpack --config webpack/webpack.config.prod.ts
if [ $? -ne 0 ]; then
  echo 'Problem encountered building the API code'
  exit 1
fi

#
# A real API would keep source map files to help with exception resolution
# My example deployment just deletes source maps to exclude them from the upload package
#
rm dist/*.map

#
# Copy down the deployed configuration
#
cp ./environments/deployed.config.json ./api.config.json

#
# Do the Serverless packaging
#
rm -rf ./.serverless
"$SLS" package --stage deployed
if [ $? -ne 0 ]; then
  echo 'Problem encountered packaging the API'
  exit 1
fi

echo 'Quit early'
exit 1

#
# Do the Serverless deployment
#
"$SLS" deploy --stage deployed --package .serverless
if [ $? -ne 0 ]; then
  echo 'Problem encountered packaging the API'
  exit 1
fi

#
# Replace the development configuration on success
#
cp ./environments/dev.config.json ./api.config.json
