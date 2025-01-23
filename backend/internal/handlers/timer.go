package handlers

import (
	"encoding/json"
	"io"
	"log"
	"math/rand"
	"net/http"
	"unicode"

	"github.com/gorilla/mux"
	"github.com/lorenzocorallo/sharetimer/internal/models"
	"gorm.io/gorm"
)

type TimerHandler struct {
	db *gorm.DB
}

func NewTimerHander(db *gorm.DB) *TimerHandler {
	return &TimerHandler {
		db: db,
	}
}

func (h *TimerHandler) generateId() string {
	const gen = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	s := make([]byte, 6)
	for {
		for i := 0; i < 6; i++ {
			n := rand.Intn(len(gen))
			s[i] = gen[n]
		}
		str := string(s)

		timer := &models.Timer{}
		if err := h.db.Where("id = ?", str).First(timer).Error; err != nil {
			// this id is free
			return str
		}
	}
}

type TimerProps struct {
	Duration int64  `json:"duration"`
	ClientId string `json:"clientId"`
}

func (h *TimerHandler) HandleCreate(w http.ResponseWriter, r *http.Request) {
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

	if len(data.ClientId) == 0 {
		http.Error(w, "you must provide the clientId", http.StatusBadRequest)
		return
	}

	id := h.generateId()
	timer := models.Timer{
		ID:          id,
		OwnerId:     data.ClientId,
		Duration:    data.Duration,
		StartTime:   0,
		LastPause:   0,
		TimeInPause: 0,
		IsRunning:   false,
	}

	h.db.Create(&timer)

	log.Printf("client id '%s' created new timer with duration %d. timer id: '%s'", data.ClientId, data.Duration, id)

	// Send success response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"timerId": id})
}

func (h *TimerHandler) HandleGet(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if len(id) != 6 {
		w.WriteHeader(400)
		return
	}

	for _, char := range id {
		if !unicode.IsLetter(char) {
			w.WriteHeader(400)
			return
		}
	}

	timer := models.Timer{}
	err := h.db.Where("id = ?", id).First(&timer).Error
	if err != nil {
		w.WriteHeader(404)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(timer)
}
