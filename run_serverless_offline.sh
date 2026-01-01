#!/bin/bash

##########################################
# A shared script to build and run the API
##########################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# A utility to change the Node.js version that Serverless Offline receives
#
function replaceServerlessVersion() {

  local _FROM='nodejs24.x';
  local _TO='nodejs22.x';
  if [ "$(uname -s)" == 'Darwin' ]; then
    sed -i '' "s/$_FROM/$_TO/" ./serverlessOffline.yml
  else
    sed -i "s/$_FROM/$_TO/" ./serverlessOffline.yml
  fi
}

#
# Make a replacement until Serverless Offline supports Node.js 24
#
rm serverlessOffline.yml 2>/dev/null
cp serverless.yml serverlessOffline.yml
replaceServerlessVersion

#
# Run Serverless offline to expose lambda endpoints at HTTPS endpoints
#
npx sls offline \
  --config ./serverlessOffline.yml \
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
