# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Define build arguments that Vite expects
ARG VITE_API_BASE_URL
ARG VITE_GEMINI_API_KEY
ARG VITE_STORE_NAME

# Set them as ENV so they are available during 'npm run build'
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ENV VITE_STORE_NAME=$VITE_STORE_NAME

COPY package*.json ./
RUN npm install

# Copy all files including .env if it exists in the context
COPY . .

# Run build - Vite will pick up the ENV variables set above
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
