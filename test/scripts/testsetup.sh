#!/bin/bash

##########################################################################
# A script to run the API with Serverless Offline and a test configuration
##########################################################################

cd "$(dirname "${BASH_SOURCE[0]}")"
cd ../..

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
# Ensure that the test configuration is used
#
cp environments/test.config.json ./api.config.json

#
# Run serverless offline as the API host and Wiremock as a mock authorization server
#
echo 'Running the Serverless API and a mock authorization server ...'
if [ "$PLATFORM" == 'MACOS' ]; then

  open -a Terminal ./test/scripts/run_wiremock.sh
  open -a Terminal ./run_api.sh

elif [ "$PLATFORM" == 'WINDOWS' ]; then

  GIT_BASH='C:\Program Files\Git\git-bash.exe'
  "$GIT_BASH" -c ./test/scripts/run_wiremock.sh &
  "$GIT_BASH" -c ./run_api.sh &

elif [ "$PLATFORM" == 'LINUX' ]; then

  gnome-terminal -- ./test/scripts/run_wiremock.sh
  gnome-terminal -- ./run_api.sh
fi

#
# Wait for endpoints to become available
#
echo 'Waiting for Wiremock endpoints to come up ...'
WIREMOCK_URL='https://login.authsamples-dev.com:447/__admin/mappings'
while [ "$(curl -k -s -X GET -o /dev/null -w '%{http_code}' "$WIREMOCK_URL")" != '200' ]; do
  sleep 2
done

echo 'Waiting for API endpoints to come up ...'
API_URL='https://api.authsamples-dev.com:446/investments/companies'
while [ "$(curl -k -s -X GET -o /dev/null -w '%{http_code}' "$API_URL")" != '401' ]; do
  sleep 2
done

#
# Indicate success
#
echo "Start tests via 'npm test' or 'npm run loadtest' ..."
