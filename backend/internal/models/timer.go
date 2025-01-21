package models

import (
	"time"
)

type Timer struct {
	ID          string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Duration    int64     `json:"duration"`
	StartTime   int64     `json:"startTime" gorm:default:0`
	LastPause   int64     `json:"lastPause" gorm:"default:0"`
	TimeInPause int64     `json:"timeInPause" gorm:"default:0"`
	IsRunning   bool      `json:"isRunning"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}
