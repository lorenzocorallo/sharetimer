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
	id   string
	conn *websocket.Conn
}

type WSServer struct {
	clients    map[*Client]bool
	ids        map[string]*Client
	timers     map[string]*Timer
	register   chan *Client
	unregister chan *Client
}

type Timer struct {
	id      string
	running bool
	owner   *Client
	clients map[string]*Client
}

type CmdMsg struct {
	raw     string
	version uint64
	sender  *Client
	area    string
	cmd     string
	args    []string
}

func NewWebSocketServer() *WSServer {
	return &WSServer{
		clients:    make(map[*Client]bool),
		ids:        make(map[string]*Client),
		timers:     make(map[string]*Timer),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (s *WSServer) Run() {
	for {
		select {
		case client := <-s.register:
			s.clients[client] = true
			log.Printf("client %v connected. Total clients: %d", client, len(s.clients))

		case client := <-s.unregister:
			if _, ok := s.clients[client]; ok {
				delete(s.clients, client)
				if len(client.id) > 0 {
					for _, timer := range s.timers {
						if timer.owner.id != client.id && timer.clients[client.id] != nil {
							delete(timer.clients, client.id)
							timer.sendEvent("leave")
						}
					}

					delete(s.ids, client.id)
				}
				client.conn.Close()
			}
			log.Printf("client %v disconnected. Total clients: %d", client, len(s.clients))
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
		if err != nil || len(splitted) < 4 {
			log.Printf("client %v sent a malformed message: \"%s\"", client, message)
			continue
		}

		if version != 1 {
			log.Printf("client %v sent a cmd with unsupported version: %d", client, version)
			continue
		}

		msgType := splitted[1]
		if msgType != "cmd" {
			log.Printf("client %v sent a msg with unrecognized type: %s (clients can only send messages of type 'cmd')", client, msgType)
			continue
		}

		area := splitted[2]
		if !slices.Contains([]string{"auth", "timer"}, area) {
			log.Printf("client %v sent a cmd with unrecognized area: \"%s\"", client, area)
			continue
		}

		cmd := splitted[3]
		args := splitted[4:]

		cmdMsg := CmdMsg{
			raw:     message,
			sender:  client,
			version: version,
			area:    area,
			cmd:     cmd,
			args:    args,
		}

		switch area {
		case "auth":
			go s.handleAuthCmd(&cmdMsg)

		case "timer":
			go s.handleTimerCmd(&cmdMsg)
		}
	}
}

func (s *WSServer) handleAuthCmd(m *CmdMsg) {
	if m.area != "auth" {
		log.Fatalf("ERROR: this message should not be handled here. msg: '%s'", m.raw)
		return
	}

	if len(m.args) < 1 {
		log.Printf("client %v tried to execute a timer cmd but did not provide args. msg: '%s'", m.sender, m.raw)
		return
	}

	switch m.cmd {
	case "setid":
		if len(m.sender.id) == 0 && len(m.args[0]) > 0 {
			m.sender.id = m.args[0]
			s.ids[m.sender.id] = m.sender
			log.Printf("client %v set id: '%s'", m.sender, m.sender.id)
		}
	}
}

func (s *WSServer) handleTimerCmd(m *CmdMsg) {
	if m.area != "timer" {
		log.Fatalf("ERROR: this message should not be handled here. msg: '%s'", m.raw)
		return
	}

	if len(m.args) < 1 {
		log.Printf("client %v tried to execute a timer cmd but did not provide args. msg: '%s'", m.sender, m.raw)
		return
	}

	if len(m.sender.id) == 0 {
		log.Printf("client %v tried to execute a timer cmd but has no id. msg: '%s'", m.sender, m.raw)
		return
	}

	timerId := strings.ToUpper(m.args[0])
	if len(timerId) != 6 {
		log.Printf("client id '%s' sent a cmd with a malformed timer id: \"%s\"", m.sender.id, timerId)
		return
	}

	timer := s.timers[timerId]

	if timer == nil && slices.Contains([]string{"join", "leave", "pause", "resume"}, m.cmd) {
		log.Printf("client id '%s' tried to %s non-existing timer with id: %s", m.sender.id, m.cmd, timerId)
		return
	}

	if timer != nil && slices.Contains([]string{"create"}, m.cmd) {
		if m.sender.id == timer.owner.id && m.sender.conn != timer.owner.conn {
			timer.owner = m.sender
		}
		log.Printf("client id '%s' tried to create already existing timer with id: %s", m.sender.id, timerId)
		return
	}

	switch m.cmd {
	case "create":
		log.Printf("client id '%s' created timer %s", m.sender.id, timerId)
		s.timers[timerId] = &Timer{
			id:      timerId,
			clients: make(map[string]*Client),
			owner:   m.sender,
			running: false,
		}

	case "join":
		if m.sender.id != timer.owner.id {
			if timer.clients[m.sender.id] == nil {
				timer.clients[m.sender.id] = m.sender
				log.Printf("client id '%s' joined timer %s", m.sender.id, timerId)
				timer.sendEvent("join")
			}
		}

	case "leave":
		if m.sender.id != timer.owner.id {
			delete(timer.clients, m.sender.id)
			log.Printf("client id '%s' left timer %s", m.sender.id, timerId)
			timer.sendEvent("leave")
		}

	case "start":
		if m.sender.id == timer.owner.id {
			timer.running = true
			log.Printf("client id '%s' started timer %s as owner", m.sender.id, timerId)
			timer.sendEvent("start")
		}

	case "pause":
		if m.sender.id == timer.owner.id {
			timer.running = false
			log.Printf("owner %v paused timer %s as owner", m.sender.id, timerId)
			timer.sendEvent("pause")
		}

	case "resume":
		if m.sender.id == timer.owner.id {
			timer.running = true
			log.Printf("owner %v resumed timer %s as owner", m.sender.id, timerId)
			timer.sendEvent("resume")
		}

	}
}

func (t *Timer) sendEvent(event string) {
	if slices.Contains([]string{"join", "leave"}, event) {
		t.owner.conn.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("1:event:timer:%s:%s", t.id, event)))
	} else {
		for _, client := range t.clients {
			client.conn.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("1:event:timer:%s:%s", t.id, event)))
		}
	}
}
