#!/bin/bash

echo "Copy current working directory to dist directory"

originalDirectory=$(pwd)

cd ..
rm -rf dist
cp -r $originalDirectory dist
cd dist

echo "Download and save all .html files from Zwitterion"

shopt -s globstar
for file in **/*.html; do
    wget -q -x -nH "http://localhost:8000/$file"
done

echo "Download and save all .ts files from Zwitterion"

shopt -s globstar
for file in **/*.ts; do
    wget -q -x -nH "http://localhost:8000/${file%.*}.js"
done

echo "Exit Zwitterion"
#cd ..
#cd src
#node_modules/.bin/nginx -p node_modules/nx-local-server -s stop

echo "Done"

exit 0
