package handlers

import (
	"encoding/json"
	"io"
	"log"
	"math/rand"
	"net/http"
	"slices"

	"github.com/gorilla/mux"
)

var ids = make([]string, 1024)

func generateId() string {
	const gen = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	for {
		s := make([]byte, 6, 6)
		for i := 0; i < 6; i++ {
			n := rand.Intn(len(gen))
			s[i] = gen[n]
		}
		str := string(s)

		if !slices.Contains(ids, str) {
			ids = append(ids, str)
			return str
		}
	}
}

type TimerProps struct {
	Duration int64 `json:"duration"`
}

func HandleCreateTimer(w http.ResponseWriter, r *http.Request) {
	// Read the request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Check if body is empty
	if len(body) == 0 {
		http.Error(w, "Request body is empty", http.StatusBadRequest)
		return
	}

	// Check if body is valid JSON and matches your struct
	var data TimerProps
	if err := json.Unmarshal(body, &data); err != nil {
		http.Error(w, "Request body is not valid JSON", http.StatusBadRequest)
		return
	}

	if data.Duration == 0 {
		http.Error(w, "duration must be greater than 0", http.StatusBadRequest)
		return
	}

	id := generateId()
	log.Printf("created new timer. duration %d. id '%s'", data.Duration, id)

	// Send success response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"timerId": id})
}

func HandleGetTimer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	if slices.Contains(ids, id) {
		w.WriteHeader(200)
	} else {
		w.WriteHeader(404)
	}
}
