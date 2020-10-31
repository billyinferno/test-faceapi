# pull official base image
FROM node:alpine

# set working directory
WORKDIR /app

# install app dependencies
COPY package.json ./
RUN yarn install
RUN yarn build

# add app
COPY . ./app

# start app
CMD ["serve", "-s", "build"]