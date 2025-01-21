package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/lorenzocorallo/sharetimer/internal/database"
	"github.com/lorenzocorallo/sharetimer/internal/websocket"
)

func init() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		// In production, we'll use real env vars, so we only log a message
		log.Println("No .env file found")
	}
}

func main() {
	// Initialize database
	database.InitDB()

	r := mux.NewRouter()
	ws := websocket.NewWebSocketServer()

	// API routes
	api := r.PathPrefix("/api").Subrouter()
	// api.HandleFunc("/timer", createTimer).Methods("POST")
	// api.HandleFunc("/timer/{id}", getTimer).Methods("GET")
	api.HandleFunc("/ws", ws.HandleWebSocket)

	// In production, serve static files
	if os.Getenv("GO_ENV") == "production" {
		spa := spaHandler{staticPath: "frontend/dist", indexPath: "index.html"}
		r.PathPrefix("/").Handler(spa)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}


// SPA handler to serve frontend
type spaHandler struct {
    staticPath string
    indexPath  string
}

func (h spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    path := filepath.Join(h.staticPath, r.URL.Path)

    _, err := os.Stat(path)
    if os.IsNotExist(err) {
        http.ServeFile(w, r, filepath.Join(h.staticPath, h.indexPath))
        return
    } else if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    http.FileServer(http.Dir(h.staticPath)).ServeHTTP(w, r)
}
