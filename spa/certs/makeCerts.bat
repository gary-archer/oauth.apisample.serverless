@echo off

REM *************************************************************************************
REM A script to use OpenSSL to create self signed certificates in a cross platform manner
REM *************************************************************************************

REM
REM Point to Open SSL configuration, using the latest precompiled EXE from here:
REM https://www.npcglib.org/~stathis/blog/precompiled-openssl/
REM
set OPENSSL=C:\tools\openssl-1.1.0f\bin\openssl.exe
set OPENSSL_CONF=C:\tools\openssl-1.1.0f\ssl\openssl.cnf

REM
REM Root certificate parameters
REM
SET ROOT_CERT_NAME=mycompany.ca
SET ROOT_CERT_PASSWORD=RootPassword1

REM
REM SSL certificate parameters
REM
SET SSL_CERT_FILE_NAME=mycompany.ssl
SET SSL_CERT_PASSWORD=SslPassword1
SET WILDCARD_DOMAIN_NAME=*.mycompany.com
SET API_DOMAIN_NAME=api.mycompany.com
SET WEB_DOMAIN_NAME=web.mycompany.com

REM
REM Create the root certificate public + private key protected by a passphrase
REM
%OPENSSL% genrsa -out %ROOT_CERT_NAME%.key 2048 -passout pass:%ROOT_CERT_PASSWORD%
if %ERRORLEVEL% NEQ 0 GOTO END
echo '*** Successfully created Root CA key'

REM
REM Create the public key root certificate file
REM
%OPENSSL% req -x509 ^
            -new ^
			-nodes ^
   			-key %ROOT_CERT_NAME%.key ^
			-out %ROOT_CERT_NAME%.pem ^
			-subj "/CN=%ROOT_CERT_NAME%.com" ^
			-sha256 ^
			-days 365
if %ERRORLEVEL% NEQ 0 GOTO END
echo '*** Successfully created Root CA'

REM
REM Create the API's certificate public + private key
REM
%OPENSSL% genrsa -out %SSL_CERT_FILE_NAME%.key 2048
if %ERRORLEVEL% NEQ 0 GOTO END
echo '*** Successfully created API key'

REM
REM Create the API's certificate signing request file
REM
%OPENSSL% req ^
            -new ^
			-key %SSL_CERT_FILE_NAME%.key ^
			-out %SSL_CERT_FILE_NAME%.csr ^
			-subj "/CN=%WILDCARD_DOMAIN_NAME%"
if %ERRORLEVEL% NEQ 0 GOTO END
echo '*** Successfully created API certificate signing request'

REM
REM Create the API's SSL certificate
REM
echo subjectAltName=DNS:%API_DOMAIN_NAME%,DNS:%WEB_DOMAIN_NAME% > subjectAlternativeNames.ext
%OPENSSL% x509 -req ^
			-in %SSL_CERT_FILE_NAME%.csr ^
			-CA %ROOT_CERT_NAME%.pem ^
			-CAkey %ROOT_CERT_NAME%.key ^
			-CAcreateserial ^
			-out %SSL_CERT_FILE_NAME%.pem ^
			-sha256 ^
			-days 365 ^
			-extfile subjectAlternativeNames.ext
if %ERRORLEVEL% NEQ 0 GOTO END
echo '*** Successfully created API SSL certificate'

REM
REM Export it to a PFX file if required
REM
%OPENSSL% pkcs12 ^
			-export -inkey %SSL_CERT_FILE_NAME%.key ^
			-in %SSL_CERT_FILE_NAME%.pem ^
			-name %WILDCARD_DOMAIN_NAME% ^
			-out %SSL_CERT_FILE_NAME%.pfx ^
			-passout pass:%SSL_CERT_PASSWORD%
echo '*** Successfully exported API SSL certificate'

:END
