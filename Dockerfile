# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install git and build dependencies
RUN apk add --no-cache git

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download all dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/main/main.go && chmod +x main

# Final stage
FROM alpine:latest

WORKDIR /app

# Copy the binary from builder with explicit permissions
COPY --from=builder --chmod=755 /app/main .
COPY templates ./templates
COPY static ./static

EXPOSE 8080

# Run the application
CMD ["./main"]