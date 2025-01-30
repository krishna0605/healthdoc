FROM node:20-alpine

WORKDIR /app

# Install dependencies strictly necessary for running the app
RUN apk add --no-cache openssl

# Copy package files (from root context)
COPY apps/api/package.json ./

# Install dependencies using npm (simpler for standalone / railway)
# If you have a lockfile, copy it too.
RUN npm install

# Copy source code (from root context)
COPY apps/api/prisma ./prisma/
COPY apps/api/src ./src/
COPY apps/api/tsconfig.json ./

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to Javascript
RUN npm run build

# Expose port
EXPOSE 3001

# Start command
CMD ["npm", "run", "start"]
