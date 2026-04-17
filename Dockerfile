FROM node:20-slim

RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN gcc -o scripts/checksum scripts/checksum.c

# Start the app
CMD ["npm", "start"]