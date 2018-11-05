#!/bin/bash
set -e

#**************************************************************************************
# A script to use OpenSSL to create self signed certificates in a cross platform manner
#**************************************************************************************

#
# Root certificate parameters
#
ROOT_CERT_NAME=mycompany.ca
ROOT_CERT_PASSWORD=RootPassword1

#
# SSL certificate parameters
#
SSL_CERT_FILE_NAME=mycompany.ssl
SSL_CERT_PASSWORD=SslPassword1
WILDCARD_DOMAIN_NAME=*.mycompany.com
API_DOMAIN_NAME=api.mycompany.com
WEB_DOMAIN_NAME=web.mycompany.com

#
# Create the root certificate public + private key protected by a passphrase
#
openssl genrsa -out $ROOT_CERT_NAME.key 2048 -passout pass:$ROOT_CERT_PASSWORD
echo '*** Successfully created Root CA key'

#
# Create the public key root certificate file
#
openssl req -x509 \
            -new \
			-nodes \
   			-key $ROOT_CERT_NAME.key \
			-out $ROOT_CERT_NAME.pem \
			-subj "/CN=$ROOT_CERT_NAME.com" \
			-sha256 \
			-days 365
echo '*** Successfully created Root CA'

#
# Create the API's certificate public + private key
#
openssl genrsa -out $SSL_CERT_FILE_NAME.key 2048
echo '*** Successfully created API key'

#
# Create the API's certificate signing request file
#
openssl req \
            -new \
			-key $SSL_CERT_FILE_NAME.key \
			-out $SSL_CERT_FILE_NAME.csr \
			-subj "/CN=$WILDCARD_DOMAIN_NAME"
echo '*** Successfully created API certificate signing request'

#
# Create the API's SSL certificate
#
echo subjectAltName=DNS:$API_DOMAIN_NAME,DNS:$WEB_DOMAIN_NAME > subjectAlternativeNames.ext
openssl x509 -req \
			-in $SSL_CERT_FILE_NAME.csr \
			-CA $ROOT_CERT_NAME.pem \
			-CAkey $ROOT_CERT_NAME.key \
			-CAcreateserial \
			-out $SSL_CERT_FILE_NAME.pem \
			-sha256 \
			-days 365 \
			-extfile subjectAlternativeNames.ext
echo '*** Successfully created API SSL certificate'

#
# Export it to a PFX file if required
#
openssl pkcs12 \
			-export -inkey $SSL_CERT_FILE_NAME.key \
			-in $SSL_CERT_FILE_NAME.pem \
			-name $WILDCARD_DOMAIN_NAME \
			-out $SSL_CERT_FILE_NAME.pfx \
			-passout pass:$SSL_CERT_PASSWORD
echo '*** Successfully exported API SSL certificate'