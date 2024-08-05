FROM node:20.15.0-alpine
WORKDIR /app
COPY index.mjs .
COPY package.json .
COPY site/ site/
RUN yarn config set registry https://registry.npmmirror.com/
RUN yarn install --production
EXPOSE 8080
CMD ["node", "index.mjs"]
