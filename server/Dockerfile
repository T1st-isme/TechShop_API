# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

FROM node:18.18.2-alpine


# # Use production node environment by default.
# ENV NODE_ENV production


WORKDIR /usr/src/app


COPY package*.json ./

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.yarn to speed up subsequent builds.
# Leverage a bind mounts to package.json and yarn.lock to avoid having to copy them into
# into this layer.
# RUN --mount=type=bind,source=package.json,target=package.json \
#     --mount=type=bind,source=yarn.lock,target=yarn.lock \
#     --mount=type=cache,target=/root/.yarn \
#     yarn install --production --frozen-lockfile



# COPY config/ ./config/ 
RUN rm -rf node_modules
RUN rm -f yarn.lock 

RUN yarn
# Copy the rest of the source files into the image.
COPY . .



# Run the application as a non-root user.
RUN  chown -R node /usr/src/app
USER node

# #Build
# RUN yarn build

# # Expose the port that the application listens on.
EXPOSE 8080
COPY config/default.json /usr/src/config/default.json
# Run the application.
CMD ["yarn", "dev"]