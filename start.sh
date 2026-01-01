#!/bin/bash

###########################################################################################
# A script to build and run the Serverless API using HTTPS locally using Serverless Offline
###########################################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Get the platform
#
case "$(uname -s)" in

  Darwin)
    PLATFORM="MACOS"
 	;;

  MINGW64*)
    PLATFORM="WINDOWS"
	;;

  Linux)
    PLATFORM="LINUX"
	;;
esac

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
# Ensure that the development configuration is used that points to AWS Cognito
# You can then run a frontend locally that calls the Serverless API
#
cp environments/dev.config.json ./api.config.json

#
# Run serverless offline as the API host
#
echo 'Running the Serverless API ...'
if [ "$PLATFORM" == 'MACOS' ]; then

  open -a Terminal ./run_serverless_offline.sh

elif [ "$PLATFORM" == 'WINDOWS' ]; then
  
  GIT_BASH="C:\Program Files\Git\git-bash.exe"
  "$GIT_BASH" -c ./run_serverless_offline.sh &

elif [ "$PLATFORM" == 'LINUX' ]; then

  gnome-terminal -- ./run_serverless_offline.sh
fi
