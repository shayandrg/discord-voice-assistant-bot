# Use an official Node.js runtime based on Alpine Linux
FROM node:16-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Install necessary dependencies, including FFmpeg
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install the project dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Run the bot
CMD ["node", "bot.js"]
