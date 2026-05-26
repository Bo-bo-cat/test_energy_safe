FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# Додаємо --legacy-peer-deps на випадок конфліктів версій
RUN npm install --legacy-peer-deps 

COPY . .

# Вимикаємо телеметрію Next.js (економить пам'ять та час)
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]