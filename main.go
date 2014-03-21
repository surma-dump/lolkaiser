package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"path"
	"strings"
	"time"

	"github.com/voxelbrain/goptions"
	"gopkg.in/surma/v1.2.1/httptools"

	"labix.org/v2/mgo"
)

var (
	options = struct {
		Port              int           `goptions:"-p, --port, description='Port to bind webserver to'"`
		MongoDB           string        `goptions:"-m, --mongodb, description='URL of MongoDB', obligatory"`
		StaticContent     string        `goptions:"--static, description='Path to static content folder'"`
		SummonerWhitelist string        `goptions:"--whitelist, description='List of whitelisted summoner IDs separated by colon'"`
		Help              goptions.Help `goptions:"-h, --help, description='Show this help'"`
	}{
		Port:          5000,
		StaticContent: "static",
	}
)

type Match struct {
	GameType string     `json:"game_type" lolkaiser:"game_type"`
	Date     time.Time  `json:"timestamp" lolkaiser:"timestamp"`
	Win      bool       `json:"win" lolkaiser:"win"`
	Length   int        `json:"length" lolkaiser:"length"`
	Teams    [][]Player `json:"teams" lolkaiser:"teams"`

	Champion         string `json:"champion" lolkaiser:"champion"`
	KDA              []int  `json:"kda" lolkaiser:"kda"`
	Gold             int    `json:"gold" lolkaiser:"gold"`
	Minions          int    `json:"minions" lolkaiser:"minions"`
	LargestMultikill int    `json:"largest_multikill" lolkaiser:"largest_multikill"`
	TimeDead         int    `json:"time_dead" lolkaiser:"time_dead"`
}

type Player struct {
	Champion     string `json:"champion"`
	SummonerName string `json:"summoner_name"`
}

func main() {
	goptions.ParseAndFail(&options)

	session, err := mgo.Dial(options.MongoDB)
	if err != nil {
		log.Fatalf("Could not connect to MongoDB: %s", err)
	}
	db := session.DB("")
	_ = db

	r := httptools.NewRegexpSwitch(map[string]http.Handler{
		"/update/(euw|na)/([0-9]+)": http.HandlerFunc(updateCollectionHandler),
		"/.+": http.FileServer(http.Dir(options.StaticContent)),
	})

	addr := fmt.Sprintf("0.0.0.0:%d", options.Port)
	log.Printf("Starting webserver on %s...", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("Could not start webserver: %s", err)
	}
}

func updateCollectionHandler(w http.ResponseWriter, r *http.Request) {
	vars := w.(httptools.VarsResponseWriter).Vars()
	server, summonderId := vars["1"].(string), vars["2"].(string)

	if !StringArray(strings.Split(options.SummonerWhitelist, ":")).Contains(server + "/" + summonderId) {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	mh, err := LolKingMatchHistory(path.Join(server, summonderId))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	json.NewEncoder(w).Encode(mh)
}

type StringArray []string

func (sa StringArray) Contains(s string) bool {
	for _, v := range sa {
		if v == s {
			return true
		}
	}
	return false
}
