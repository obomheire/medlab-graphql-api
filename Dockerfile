# Use the desired Node.js version.
ARG NODE_VERSION=18.17.0
FROM node:${NODE_VERSION}-alpine

# Set the default environment to development.
ENV NODE_ENV development

# Install Python and required dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    # Required for PyMuPDF
    build-base \
    python3-dev \
    musl-dev \
    freetype-dev \
    jpeg-dev \
    zlib-dev \
    openjpeg-dev

# Set Python3 as default
RUN ln -sf python3 /usr/bin/python

# Install Python packages
RUN pip3 install --no-cache-dir \
    pymupdf \
    markdownify

# Set the working directory inside the container.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files to leverage Docker caching.
COPY package*.json ./

# Install all dependencies, including devDependencies, using npm.
RUN npm install

# Copy the rest of the application files.
COPY . .

# Change ownership to non-root user.
RUN chown -R node:node /usr/src/app

# Switch to non-root user.
USER node

# Expose the port on which the app will run.
EXPOSE 7000

# Command to run the application.
CMD ["npm", "start"]

# # Use the desired Node.js version.
# ARG NODE_VERSION=18.17.0
# FROM node:${NODE_VERSION}-alpine

# # Set the default environment to development.
# ENV NODE_ENV development

# # Set the working directory inside the container.
# WORKDIR /usr/src/app

# # Copy package.json and package-lock.json files to leverage Docker caching.
# COPY package*.json ./

# # Install all dependencies, including devDependencies, using npm.
# RUN npm install

# # Copy the rest of the application files.
# COPY . .

# # Change ownership to non-root user.
# RUN chown -R node:node /usr/src/app

# # Switch to non-root user.
# USER node

# # Expose the port on which the app will run.
# EXPOSE 7000

# # Command to run the application.
# CMD ["npm", "start"]


