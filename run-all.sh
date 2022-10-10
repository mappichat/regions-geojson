#!/bin/sh

for i in {0..8}
do
  node index.js $i 50000
done