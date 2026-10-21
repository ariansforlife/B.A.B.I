FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY . .
RUN go mod tidy
RUN CGO_ENABLED=0 go build -o /api ./cmd/api

FROM alpine:3.21
RUN adduser -D -u 10001 babi
USER babi
COPY --from=build /api /api
EXPOSE 8080
CMD ["/api"]
