package database

import (
	"log"
	"os"

	"github.com/lorenzocorallo/sharetimer/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB
var config *Config

func InitDB() {
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
		log.Fatal(err)
	}

	dsn := config.makeDsn(true)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto Migrate
	err = db.AutoMigrate(&models.Timer{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	DB = db
}
