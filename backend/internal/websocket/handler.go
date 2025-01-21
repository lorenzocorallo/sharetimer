package websocket

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type WSClient struct {
	Conn *websocket.Conn
}

type WSServer struct {
	clients  map[*WSClient]bool
	mux      sync.RWMutex
	upgrader websocket.Upgrader
}

func NewWebSocketServer() *WSServer {
	return &WSServer{
		clients:  make(map[*WSClient]bool),
		upgrader: upgrader,
		mux:      sync.RWMutex{},
	}
}

func (s *WSServer) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error upgrading connection: %v", err)
		return
	}

	client := WSClient{
		Conn: conn,
	}

	s.mux.Lock()
	s.clients[&client] = true
	s.mux.Unlock()

	log.Printf("Client %v connected. Total clients: %d", client, len(s.clients))

	go s.handleClient(&client)
}

func (s *WSServer) handleClient(client *WSClient) {
	defer func() {
		// Clean up when the client disconnects
		s.mux.Lock()
		delete(s.clients, client)
		s.mux.Unlock()

		client.Conn.Close()
		log.Printf("Client %v disconnected. Total clients: %d", client, len(s.clients))
	}()

	for {
		// Read message from client
		messageType, message, err := client.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway,
				websocket.CloseAbnormalClosure) {
				log.Printf("Client %v error: %v", client, err)
			}
			break
		}

		// Log the received message
		log.Printf("Received message from client %v: %s", client, message)

		// Broadcast the message to all clients
		s.broadcastMessage(client, messageType, message)
	}
}

// broadcastMessage sends a message to all connected clients
func (s *WSServer) broadcastMessage(sender *WSClient, messageType int, message []byte) {
	s.mux.RLock()
	defer s.mux.RUnlock()

	for client := range s.clients {
		// You can choose to skip sending to the sender by uncommenting the next line
		if client == sender {
			continue
		}

		log.Printf("Sending msg from %v to %v", sender, client)

		err := client.Conn.WriteMessage(messageType, message)
		if err != nil {
			log.Printf("Error broadcasting to client %v: %v", client, err)
		}
	}
}
