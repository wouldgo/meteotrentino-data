FROM arm64v8/node:14.17.0-alpine3.13 AS builder
RUN apk add --no-cache \
  python3 \
  make \
  build-base
WORKDIR /home
COPY . logic
WORKDIR /home/logic
RUN find . -maxdepth 1 ! \
  \( \
    -name "src" -o \
    -name "_conf.js" -o \
    -name "index.js" -o \
    -name "package.json" -o \
    -name "package-lock.json" \
  \) \
  -exec rm -Rf {} + || true
RUN npm ci

FROM arm64v8/node:14.17.0-alpine3.13 AS runner
WORKDIR /home
COPY --from=builder /home/logic .
CMD ["node", "index.js"]
