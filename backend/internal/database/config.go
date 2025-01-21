package database

import (
	"fmt"
)

type Config struct {
	host     string
	port     string
	user     string
	password string
	dbName   string
	sslmode  string
}

func (c *Config) makeDsn(withDbName bool) string {
	var dbName string = ""
	if withDbName {
		dbName = fmt.Sprintf("dbname=%s", config.dbName)
	}

	return fmt.Sprintf("host=%s port=%s user=%s password=%s sslmode=%s %s",
		config.host,
		config.port,
		config.user,
		config.password,
		config.sslmode,
		dbName,
	)
}


