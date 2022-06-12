#!/bin/bash

#################################
# A script to run lambdas locally
#################################

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
# Install dependencies if needed
#
if [ ! -d 'node_modules' ]; then
  npm install
  if [ $? -ne 0 ]; then
    echo 'Problem encountered installing API dependencies'
    exit
  fi
fi

#
# Build the API code
#
npm run build
if [ $? -ne 0 ]; then
  echo 'Problem encountered building the API'
  exit
fi

#
# Run wiremock in a child window, to act as a mock Authorization Server
#
echo 'Running Wiremock ...'
if [ "$PLATFORM" == 'MACOS' ]; then

  open -a Terminal ./run_wiremock.sh

elif [ "$PLATFORM" == 'WINDOWS' ]; then

  GIT_BASH="C:\Program Files\Git\git-bash.exe"
  "$GIT_BASH" -c ./run_wiremock.sh &

elif [ "$PLATFORM" == 'LINUX' ]; then

  gnome-terminal -- ./run_wiremock.sh
fi

#
# Wait for endpoints to become available
#
echo 'Waiting for Wiremock endpoints to come up ...'
WIREMOCK_URL='http://login.authsamples-dev.com/__admin/mappings'
while [ "$(curl -s -X GET -o /dev/null -w '%{http_code}' "$WIREMOCK_URL")" != '200' ]; do
  sleep 2
done

#
# Run all lambdas via some mocha tests
#
npm test
if [ $? -ne 0 ]; then
  echo 'Problem encountered running lambdas'
  exit
fi
