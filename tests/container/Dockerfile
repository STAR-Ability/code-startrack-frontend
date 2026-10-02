# Test tools only: trusted TLS lives in this disposable Linux trust store.
FROM mcr.microsoft.com/playwright:v1.63.0-noble
WORKDIR /checks
RUN apt-get update && apt-get install -y --no-install-recommends libnss3-tools openssl \
    && rm -rf /var/lib/apt/lists/*
RUN npm install --no-save --ignore-scripts @playwright/test@1.63.0
COPY browser-check.mjs ./
CMD ["node", "browser-check.mjs"]
