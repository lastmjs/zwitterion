# zwitterion-production

## Installation

```
sudo apt-get update
sudo apt-get install nginx
```

## Use

### Development Use

Start the server: `npm start`
Stop the server: `npm run stop`

### Production Use

Make sure the machine that you deploy to has NGINX installed.

#### Dokku

If you are using Dokku, do the following:

```
//The following is for HTTPS
//find your public key and private key, and transform them into the format that dokku needs
cat [public-key].pem > server.crt
cat [private-key].pem > server.key
dokku certs:add [app-name] server.crt server.key
```

#### Custom

```
sudo apt-get update //make sure packages are up to date
sudo apt-get upgrade // not sure exactly what this does, look into it
sudo apt-get install nginx

//What does the -y option on the apt-get command do?
```

NGINX https config:
```
# redirect all http GET traffic to https
server {
    listen 80;
    server_name solutiamaxima.com www.solutiamaxima.com;
    return 301 https://solutiamaxima.com$request_uri;
}

server {
  listen 443 ssl;
  server_name solutiamaxima.com www.solutiamaxima.com;
  root /home/ubuntu/test-nginx;
  ssl_certificate /etc/letsencrypt/live/solutiamaxima.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/solutiamaxima.com/privkey.pem;
}
```

How to get a Let's Encrypt certificate:

```
sudo apt-get install letsencrypt
sudo letsencrypt certonly --standalone -d solutiamaxima.com -d www.solutiamaxima.com
//now set up nginx to point to the certificate location...
```
