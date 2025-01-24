package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"path/filepath"

	ghandlers "github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/lorenzocorallo/sharetimer/internal/ctx"
	"github.com/lorenzocorallo/sharetimer/internal/database"
	"github.com/lorenzocorallo/sharetimer/internal/handlers"
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
	db, err := database.InitDB()
	if err != nil {
		log.Fatal(err)
	}

	timerHandler := handlers.NewTimerHander(db)
	r := mux.NewRouter()
	api := r.PathPrefix("/api").Subrouter()
	api.Use(ClientIDMiddleware)
	api.HandleFunc("/", indexHandler).Methods("GET")
	api.HandleFunc("/timer", timerHandler.HandleCreate).Methods("POST")
	api.HandleFunc("/timer/{id}", timerHandler.HandleGet).Methods("GET")

	ws := websocket.NewWebSocketServer()
	go ws.Run()
	r.HandleFunc("/ws", ws.HandleWebSocket)

	// In production, serve static files
	if os.Getenv("GO_ENV") == "production" {
		spa := spaHandler{staticPath: "frontend/dist", indexPath: "index.html"}
		r.PathPrefix("/").Handler(spa)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	corsHandler := ghandlers.CORS(
		ghandlers.AllowedOrigins([]string{"*"}), // Allow all origins
		ghandlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		ghandlers.AllowedHeaders([]string{"Content-Type", "x-client-id", "Authorization"}),
	)(r)
	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, corsHandler))
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

func indexHandler(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("hello world"))
}

func ClientIDMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		clientID := r.Header.Get("X-Client-ID")

		if clientID == "" {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("error: X-Client-ID header is required"))
			return
		}

		if len(clientID) != 21 {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("error: X-Client-ID header value is not valid"))
			return
		}

		ctx := context.WithValue(r.Context(), ctx.Keys.ClientID, clientID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
