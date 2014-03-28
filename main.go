package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/surma/httptools"
	"github.com/voxelbrain/goptions"

	"labix.org/v2/mgo"
	"labix.org/v2/mgo/bson"
)

var (
	options = struct {
		Port              int           `goptions:"-p, --port, description='Port to bind webserver to'"`
		MongoDB           string        `goptions:"-m, --mongodb, description='URL of MongoDB', obligatory"`
		StaticContent     string        `goptions:"--static, description='Path to static content folder'"`
		SummonerWhitelist string        `goptions:"-w, --whitelist, description='List of whitelisted summoner IDs separated by colon'"`
		Help              goptions.Help `goptions:"-h, --help, description='Show this help'"`
	}{
		Port:          5000,
		StaticContent: "dist",
	}
)

var (
	db *mgo.Database
)

func main() {
	goptions.ParseAndFail(&options)

	session, err := mgo.Dial(options.MongoDB)
	if err != nil {
		log.Fatalf("Could not connect to MongoDB: %s", err)
	}
	db = session.DB("")

	r := httptools.NewRegexpSwitch(map[string]http.Handler{
		"/(euw|na)/([0-9]+)": httptools.L{
			httptools.SilentHandler(http.HandlerFunc(whitelistHandler)),
			httptools.MethodSwitch{
				"POST": http.HandlerFunc(updateMatchHistory),
				"GET":  http.HandlerFunc(queryMatchHistory),
			},
		},
		"/.*": http.FileServer(http.Dir(options.StaticContent)),
	})

	addr := fmt.Sprintf("0.0.0.0:%d", options.Port)
	log.Printf("Starting webserver on %s...", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("Could not start webserver: %s", err)
	}
}

func whitelistHandler(w http.ResponseWriter, r *http.Request) {
	vars := w.(httptools.VarsResponseWriter).Vars()
	server, summonerId := vars["1"].(string), vars["2"].(string)

	if !StringArray(strings.Split(options.SummonerWhitelist, ":")).Contains(server + "/" + summonerId) {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}
}

func updateMatchHistory(w http.ResponseWriter, r *http.Request) {
	vars := w.(httptools.VarsResponseWriter).Vars()
	server, summonerId := vars["1"].(string), vars["2"].(string)
	c := db.C(server + "-" + summonerId)

	mh, err := LolKingMatchHistory(server + "/" + summonerId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	for _, m := range mh {
		_, err := c.Upsert(bson.M{
			"timestamp": m.Date,
		}, m)
		if err != nil {
			log.Printf("Update failed: %s", err)
			http.Error(w, "Update failed", http.StatusInternalServerError)
			return
		}
	}
	http.Error(w, "", http.StatusNoContent)
}

func queryMatchHistory(w http.ResponseWriter, r *http.Request) {
	vars := w.(httptools.VarsResponseWriter).Vars()
	server, summonerId := vars["1"].(string), vars["2"].(string)
	c := db.C(server + "-" + summonerId)

	var mh []*Match
	if err := c.Find(bson.M{}).Sort("-timestamp").All(&mh); err != nil {
		log.Printf("Query failed: %s", err)
		http.Error(w, "Query failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	enc := json.NewEncoder(w)
	enc.Encode(mh)
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
