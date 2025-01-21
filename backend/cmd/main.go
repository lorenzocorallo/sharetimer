package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/lorenzocorallo/sharetimer/internal/database"
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

	// API routes
	api := r.PathPrefix("/api").Subrouter()
	api.HandleFunc("/timer", createTimer).Methods("POST")
	api.HandleFunc("/timer/{id}", getTimer).Methods("GET")
	api.HandleFunc("/ws/timer/{id}", handleWebSocket)

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
