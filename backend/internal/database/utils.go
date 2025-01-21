package database

import (
	"database/sql"
	"fmt"

  _ "github.com/lib/pq"
)

func createDBIfNotExists() error {
	// Connect to postgres default database to check if our DB exists
	dsn := config.makeDsn(false)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return fmt.Errorf("error connecting to postgres: %v", err)
	}
	defer db.Close()

	// Check if database exists
	var exists bool
	query := fmt.Sprintf("SELECT EXISTS(SELECT datname FROM pg_catalog.pg_database "+
		"WHERE datname = '%s');", config.dbName)
	err = db.QueryRow(query).Scan(&exists)
	if err != nil {
		return fmt.Errorf("error checking if database exists: %v", err)
	}

	// Create database if it doesn't exist
	if !exists {
		createQuery := fmt.Sprintf("CREATE DATABASE %s;", config.dbName)
		_, err = db.Exec(createQuery)
		if err != nil {
			return fmt.Errorf("error creating database: %v", err)
		}
		fmt.Printf("Database %s created successfully\n", config.dbName)
	}

	return nil
}
