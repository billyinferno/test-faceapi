#!/bin/sh
# docker run -itd --rm -v ${PWD}:/app -v /app/node_modules -p 4001:3000 -e CHOKIDAR_USEPOLLING=true test-faceapi:dev
docker run -itd --rm -p 4002:80 test-faceapi:prod