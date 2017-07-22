#!/bin/bash

echo "Copy current working directory to dist directory"

originalDirectory=$(pwd)

rm -rf dist
cd ..
rm -rf dist
cp -r $originalDirectory dist
cd dist

echo "Download and save all .html files from Zwitterion"

shopt -s globstar
for file in **/*.html; do
    echo $file
    wget -q -x -nH "http://localhost:8000/$file"
done

echo "Download and save all .ts files from Zwitterion"

shopt -s globstar
for file in **/*.ts; do
    echo $file
    wget -q -x -nH "http://localhost:8000/${file%.*}.js"
done

echo "Copy dist to root directory"

cd ..
cp -r dist $originalDirectory/dist
rm -rf dist

echo "Static build finished"
