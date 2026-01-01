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
# Ensure that the development configuration is used that points to AWS Cognito
# You can then run a frontend locally that calls the Serverless API
#
cp environments/dev.config.json ./api.config.json

#
# Run serverless offline as the API host
#
echo 'Running the Serverless API ...'
if [ "$PLATFORM" == 'MACOS' ]; then

  open -a Terminal ./run_api.sh

elif [ "$PLATFORM" == 'WINDOWS' ]; then
  
  GIT_BASH="C:\Program Files\Git\git-bash.exe"
  "$GIT_BASH" -c ./run_api.sh &

elif [ "$PLATFORM" == 'LINUX' ]; then

  gnome-terminal -- ./run_api.sh
fi
