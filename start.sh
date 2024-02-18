#!/bin/bash

##########################################################################
# A script to run lambdas locally, from login to logout
# On Windows, ensure that you have first set Git bash as the node.js shell
# npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"
##########################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

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
# Check code quality
#
npm run lint
if [ $? -ne 0 ]; then
  echo 'Code quality checks failed'
  exit
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
# Run wiremock in a child window, to act as a mock Authorization Server
#
echo 'Running Wiremock ...'
if [ "$PLATFORM" == 'MACOS' ]; then

  open -a Terminal ./test/scripts/run_wiremock.sh

elif [ "$PLATFORM" == 'WINDOWS' ]; then

  GIT_BASH="C:\Program Files\Git\git-bash.exe"
  "$GIT_BASH" -c ./test/scripts/run_wiremock.sh &

elif [ "$PLATFORM" == 'LINUX' ]; then

  gnome-terminal -- ./test/scripts/run_wiremock.sh
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
# Run all lambda functions locally via some mocha tests
#
./node_modules/.bin/mocha
if [ $? -ne 0 ]; then
  echo 'Problem encountered running lambdas'
  exit
fi
