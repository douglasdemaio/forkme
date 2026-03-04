FROM docker.io/library/node:22-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 8081 19000 19001 19002
CMD ["npx", "expo", "start", "--web", "--port", "8081"]
