package handlers

import (
	"encoding/json"
	"io"
	"log"
	"math/rand"
	"net/http"
	"time"
	"unicode"

	"github.com/gorilla/mux"
	"github.com/lorenzocorallo/sharetimer/internal/ctx"
	"github.com/lorenzocorallo/sharetimer/internal/models"
	"gorm.io/gorm"
)

type TimerHandler struct {
	db *gorm.DB
}

func NewTimerHander(db *gorm.DB) *TimerHandler {
	return &TimerHandler{
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
	Duration int64 `json:"duration"`
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

	clientId := r.Context().Value(ctx.Keys.ClientID).(string)
	log.Printf("client has id: %s", clientId)

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

	id := h.generateId()
	timer := models.Timer{
		ID:          id,
		OwnerId:     clientId,
		Duration:    data.Duration,
		StartTime:   0,
		LastPause:   0,
		TimeInPause: 0,
		IsRunning:   false,
	}

	h.db.Create(&timer)

	log.Printf("client id '%s' created new timer with duration %d. timer id: '%s'", clientId, data.Duration, id)

	// Send success response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"timerId": id})
}

// omit the ownerId to avoid privilage escalation client-side
type TimerResponse struct {
	ID          string    `json:"timerId"`
	IsOwner     bool      `json:"isOwner"`
	Duration    int64     `json:"duration"`
	StartTime   int64     `json:"startTime"`
	LastPause   int64     `json:"lastPause"`
	TimeInPause int64     `json:"timeInPause"`
	IsRunning   bool      `json:"isRunning"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
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

	clientId := r.Context().Value(ctx.Keys.ClientID).(string)
	timerResponse := TimerResponse{
		ID:          timer.ID,
		IsOwner:     timer.OwnerId == clientId,
		Duration:    timer.Duration,
		StartTime:   timer.StartTime,
		LastPause:   timer.LastPause,
		TimeInPause: timer.TimeInPause,
		IsRunning:   timer.IsRunning,
		CreatedAt:   timer.CreatedAt,
		UpdatedAt:   timer.UpdatedAt,
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(timerResponse)
}
