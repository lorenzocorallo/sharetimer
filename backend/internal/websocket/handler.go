package websocket

import (
	"fmt"
	"log"
	"net/http"
	"slices"
	"strconv"
	"strings"

	"github.com/gorilla/websocket"
)

type Client struct {
	conn *websocket.Conn
}

type Msg struct {
	sender *Client
	data   []byte
}

type WSServer struct {
	clients    map[*Client]bool
	timers     map[string]*Timer
	register   chan *Client
	unregister chan *Client
	broadcast  chan *Msg
}

type Timer struct {
	id      string
	running bool
	owner   *Client
	clients map[*Client]bool
}

func NewWebSocketServer() *WSServer {
	return &WSServer{
		clients:    make(map[*Client]bool),
		timers:     make(map[string]*Timer),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *Msg),
	}
}

func (s *WSServer) Run() {
	for {
		select {
		case client := <-s.register:
			s.clients[client] = true
			log.Printf("Client %v connected. Total clients: %d", client, len(s.clients))

		case client := <-s.unregister:
			if _, ok := s.clients[client]; ok {
				delete(s.clients, client)
				client.conn.Close()
			}
			log.Printf("Client %v disconnected. Total clients: %d", client, len(s.clients))
		}
	}
}

func (s *WSServer) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error upgrading connection: %v", err)
		return
	}

	client := &Client{conn: conn}
	go s.handleClient(client)
}

func (s *WSServer) handleClient(client *Client) {
	s.register <- client
	defer func() {
		s.unregister <- client
	}()

	for {
		t, bytes, err := client.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Error reading message: %v", err)
			}
			break
		}

		if t != websocket.TextMessage {
			log.Printf("Recieved a non-textual message from client %v", client)
			continue
		}

		message := string(bytes)
		splitted := strings.Split(message, ":")

		version, err := strconv.ParseUint(splitted[0], 10, 64)
		if err != nil || len(splitted) < 3 {
			log.Printf("client %v sent a malformed message: \"%s\"", client, message)
			continue
		}

		if version != 1 {
			log.Printf("client %v sent a cmd with unsupported version: %d", client, version)
			continue
		}

		cmd := splitted[1]
		timerId := strings.ToUpper(splitted[2])
		// args := splitted[3:]

		if len(timerId) != 6 {
			log.Printf("client %v sent a cmd with a malformed timer id: \"%s\"", client, timerId)
			continue
		}

		timer := s.timers[timerId]

		if timer == nil && slices.Contains([]string{"join", "leave", "pause", "resume"}, cmd) {
			log.Printf("client %v tried to %s non-existing timer with id: %s", client, cmd, timerId)
			continue
		}

		if timer != nil && slices.Contains([]string{"create"}, cmd) {
			log.Printf("client %v tried to create already existing timer with id: %s", client, timerId)
			continue
		}

		log.Printf("client %v sent command: \"%s\"", client, message)

		switch cmd {
		case "create":
			log.Printf("client %v created timer %s", client, timerId)
			s.timers[timerId] = &Timer{
				id:      timerId,
				clients: make(map[*Client]bool),
				owner:   client,
				running: false,
			}

		case "join":
			if client != timer.owner {
				timer.clients[client] = true
				log.Printf("client %v joined timer %s", client, timerId)
			}

		case "leave":
			if client != timer.owner {
				delete(timer.clients, client)
				log.Printf("client %v left timer %s", client, timerId)
			}

		case "start":
			if client == timer.owner {
				timer.running = true
				log.Printf("client %v started timer %s as owner", client, timerId)
				go timer.notifyRunning(true)
			}

		case "pause":
			if client == timer.owner {
				timer.running = false
				log.Printf("owner %v paused timer %s as owner", client, timerId)
				go timer.notifyRunning(false)
			}

		case "resume":
			if client == timer.owner {
				timer.running = true
				log.Printf("owner %v resumed timer %s as owner", client, timerId)
				go timer.notifyRunning(false)
			}

		default:
			log.Printf("client %v tried to execute a not-found command: %s", client, cmd)
		}
	}
}

func (t *Timer) notifyRunning(started bool) {
	for client := range t.clients {
		if started {
			client.conn.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("1:started:%s", t.id)))
			continue
		}

		if t.running {
			client.conn.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("1:resumed:%s", t.id)))
		} else {
			client.conn.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("1:paused:%s", t.id)))
		}
	}
}
