FROM --platform=$BUILDPLATFORM node:20-slim AS frontend
COPY frontend /app
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM --platform=$BUILDPLATFORM golang:1.23-alpine AS backend
WORKDIR /app
COPY backend/ .
RUN go mod download 
ARG TARGETARCH
RUN GO_ENV=production CGO_ENABLED=0 GOOS=linux GOARCH=$TARGETARCH go build -o server ./cmd/

FROM --platform=$TARGETPLATFORM alpine:latest AS prod
LABEL org.opencontainers.image.source=https://github.com/lorenzocorallo/sharetimer
LABEL org.opencontainers.image.description="ShareTimer"
LABEL org.opencontainers.image.licenses=MIT
WORKDIR /app
COPY --from=frontend /app/dist ./frontend/dist
COPY --from=backend /app/server .
EXPOSE 8080
CMD ["./server"]

