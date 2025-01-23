package database

import (
	"os"

	"github.com/lorenzocorallo/sharetimer/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var config *Config

func InitDB() (*gorm.DB, error) {
	config = &Config{
		host:     os.Getenv("DB_HOST"),
		port:     os.Getenv("DB_PORT"),
		user:     os.Getenv("DB_USER"),
		password: os.Getenv("DB_PASSWORD"),
		dbName:   os.Getenv("DB_NAME"),
		sslmode:  os.Getenv("DB_SSL_MODE"),
	}

	err := createDBIfNotExists()
	if err != nil {
		return nil, err
	}

	dsn := config.makeDsn(true)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Auto Migrate
	err = db.AutoMigrate(&models.Timer{})
	if err != nil {
		return nil, err
	}

	return db, nil
}
