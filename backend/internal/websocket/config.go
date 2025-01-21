package websocket

import (
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		allowedOrigins := strings.Split(os.Getenv("WS_ALLOWED_ORIGINS"), ",")
		origin := r.Header.Get("Origin")

		if os.Getenv("GO_ENV") == "development" {
			return true
		}

		for _, allowed := range allowedOrigins {
			if origin == allowed {
				return true
			}
		}
		return false
	},
}
