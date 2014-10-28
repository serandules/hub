hub
===

openssl genrsa -out ca.key 1024

openssl genrsa -out hub.key 1024
openssl req -new -key hub.key -out hub.csr
openssl x509 -req -in hub.csr -signkey hub.key -out hub.crt

openssl genrsa -out hub-client.key 1024
openssl req -new -key hub-client.key -out hub-client.csr
openssl x509 -req -in hub-client.csr -signkey hub-client.key -out hub-client.crt


aws-key
aws-secret
http://d11gtukpy8w5r2.cloudfront.net/
