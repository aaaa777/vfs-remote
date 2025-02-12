#!/bin/bash
rm -rf ../server/web/*

rm -rf dist/*
rm -rf vfs
rm -rf node_modules/*
rm -f package-lock.json
rm -f src/dir_map.ts
mkdir -p ./dist/assets/wasm

# this script uses rbwasm command be removed wasi-vfs
rm -f Gemfile
rm -f Gemfile.lock
cp gemfiles/base Gemfile

gem cleanup
bundle i
bundle exec rbwasm build --dest-dir ./vfs --build-profile minimal --no-stdlib -o dist/assets/wasm/ruby.wasm

mkdir -p ./vfs/app
cp -r ./lib ./vfs/app

touch ./vfs/vfs-files.txt
find vfs > ./vfs/vfs-files.txt
mv ./vfs ./dist/assets/vfs

ruby generate_dir_tree.rb

# npm
npm i
npm run build

cp src/index.html dist/index.html
cp src/dummy.txt dist/dummy.txt

mv dist ../../server/web/base+nostdlib



rm -rf dist/*
rm -rf vfs
rm -rf node_modules/*
rm -f package-lock.json
rm -f src/dir_map.ts
mkdir -p ./dist/assets/wasm

# this script uses rbwasm command be removed wasi-vfs
rm -f Gemfile
rm -f Gemfile.lock
cp gemfiles/base Gemfile

gem cleanup
bundle i
bundle exec rbwasm build --dest-dir ./vfs --build-profile minimal --stdlib -o dist/assets/wasm/ruby.wasm

mkdir -p ./vfs/app
cp -r ./lib ./vfs/app

touch ./vfs/vfs-files.txt
find vfs > ./vfs/vfs-files.txt
mv ./vfs ./dist/assets/vfs

ruby generate_dir_tree.rb

# npm
npm i
npm run build

cp src/index.html dist/index.html
cp src/dummy.txt dist/dummy.txt

mv dist ../../server/web/base+stdlib



rm -rf dist/*
rm -rf vfs
rm -rf node_modules/*
rm -f package-lock.json
rm -f src/dir_map.ts
mkdir -p ./dist/assets/wasm

# this script uses rbwasm command be removed wasi-vfs
rm -f Gemfile
rm -f Gemfile.lock
cp gemfiles/patch+stdlib Gemfile

gem cleanup
bundle i
bundle exec rbwasm build --dest-dir ./vfs --build-profile minimal --stdlib -o dist/assets/wasm/ruby.wasm

mkdir -p ./vfs/app
cp -r ./lib ./vfs/app

touch ./vfs/vfs-files.txt
find vfs > ./vfs/vfs-files.txt
mv ./vfs ./dist/assets/vfs

ruby generate_dir_tree.rb

# npm
npm i
npm run build

cp src/index.html dist/index.html
cp src/dummy.txt dist/dummy.txt

mv dist ../../server/web/patch+stdlib
