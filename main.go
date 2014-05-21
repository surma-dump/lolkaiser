package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/surma/httptools"
	"github.com/voxelbrain/goptions"

	"github.com/TrevorSStone/goriot"

	"labix.org/v2/mgo"
	"labix.org/v2/mgo/bson"
)

var (
	options = struct {
		Port              int           `goptions:"-p, --port, description='Port to bind webserver to'"`
		MongoDB           string        `goptions:"-m, --mongodb, description='URL of MongoDB', obligatory"`
		APIKey            string        `goptions:"-k, --key, description='Riot API key', obligatory"`
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

	goriot.SetAPIKey(options.APIKey)

	session, err := mgo.Dial(options.MongoDB)
	if err != nil {
		log.Fatalf("Could not connect to MongoDB: %s", err)
	}
	db = session.DB("")

	r := httptools.NewRegexpSwitch(map[string]http.Handler{
		"/([a-z]+)/([0-9]+)/parse": httptools.L{
			httptools.SilentHandler(http.HandlerFunc(whitelistHandler)),
			httptools.L{
				httptools.SilentHandler(http.HandlerFunc(parseMatchHistory)),
				http.HandlerFunc(dumpMatchHistory),
			},
		},
		"/([a-z]+)/([0-9]+)": httptools.L{
			httptools.SilentHandler(http.HandlerFunc(whitelistHandler)),
			httptools.MethodSwitch{
				"POST": httptools.L{
					httptools.SilentHandler(http.HandlerFunc(parseMatchHistory)),
					http.HandlerFunc(saveMatchHistory),
				},
				"GET": httptools.L{
					httptools.SilentHandler(http.HandlerFunc(queryMatchHistory)),
					http.HandlerFunc(dumpMatchHistory),
				},
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

var (
	SERVERS = []string{"br", "eune", "euw", "lan", "las", "na", "oce"}
)

func whitelistHandler(w http.ResponseWriter, r *http.Request) {
	vars := w.(httptools.VarsResponseWriter).Vars()
	server, summonerId := vars["1"].(string), vars["2"].(string)
	server = strings.ToLower(server)

	if !StringArray(SERVERS).Contains(server) {
		http.Error(w, "Invalid region", http.StatusBadRequest)
		return
	}
	vars["server"] = server

	numSummonerId, err := strconv.ParseInt(summonerId, 10, 64)
	if err != nil {
		http.Error(w, "Non-numeric summoner id", http.StatusBadRequest)
		return
	}
	vars["summonerId"] = numSummonerId

	if !StringArray(strings.Split(options.SummonerWhitelist, ":")).Contains(server + "/" + summonerId) {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}
}

func parseMatchHistory(w http.ResponseWriter, r *http.Request) {
	vars := w.(httptools.VarsResponseWriter).Vars()
	server, summonerId := vars["server"].(string), vars["summonerId"].(int64)

	mh, err := goriot.RecentGameBySummoner(server, summonerId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	vars["history"] = mh
}

func saveMatchHistory(w http.ResponseWriter, r *http.Request) {
	vars := w.(httptools.VarsResponseWriter).Vars()
	mh := vars["history"].([]goriot.Game)
	server, summonerId := vars["server"].(string), vars["summonerId"].(int64)
	c := db.C(fmt.Sprintf("%s-%d", server, summonerId))

	for _, m := range mh {
		_, err := c.Upsert(bson.M{
			"timestamp": m.CreateDate,
		}, m)
		if err != nil {
			log.Printf("Update failed: %s", err)
			http.Error(w, "Update failed", http.StatusInternalServerError)
			return
		}
	}
	http.Error(w, "", http.StatusNoContent)
}

func dumpMatchHistory(w http.ResponseWriter, r *http.Request) {
	vars := w.(httptools.VarsResponseWriter).Vars()
	mh := vars["history"].([]goriot.Game)

	w.Header().Set("Content-Type", "application/json")
	enc := json.NewEncoder(w)
	enc.Encode(mh)
}

func queryMatchHistory(w http.ResponseWriter, r *http.Request) {
	vars := w.(httptools.VarsResponseWriter).Vars()
	server, summonerId := vars["server"].(string), vars["summonerId"].(int64)
	c := db.C(fmt.Sprintf("%s-%d", server, summonerId))

	var mh []goriot.Game
	if err := c.Find(bson.M{}).Sort("-timestamp").All(&mh); err != nil {
		log.Printf("Query failed: %s", err)
		http.Error(w, "Query failed", http.StatusInternalServerError)
		return
	}

	vars["history"] = mh
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
