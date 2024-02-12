#!/bin/bash

########################################################
# A script to run Wiremock in Docker in a child terminal
########################################################

cd "$(dirname "${BASH_SOURCE[0]}")"
cd ../..

#
# Run Wiremock over HTTPS using Docker
#
docker run -it --rm \
  --name wiremock \
  -p 80:80 \
  wiremock/wiremock:3.3.1 \
  --root-dir test/integration \
  --port 80

#
# Prevent automatic terminal closure
#
read -n 1
