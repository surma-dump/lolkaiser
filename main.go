package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"path"

	"github.com/gorilla/mux"
	"github.com/voxelbrain/goptions"
)

var (
	options = struct {
		Port int           `goptions:"-p, --port, description='Port to bind webserver to'"`
		Help goptions.Help `goptions:"-h, --help, description='Show this help'"`
	}{
		Port: 5000,
	}
)

func main() {
	goptions.ParseAndFail(&options)

	r := mux.NewRouter()
	r.HandleFunc("/{server}/{id}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		mh, err := LolKingMatchHistory(path.Join(vars["server"], vars["id"]))
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		json.NewEncoder(w).Encode(mh)
	})

	addr := fmt.Sprintf("0.0.0.0:%d", options.Port)
	log.Printf("Starting webserver on %s...", addr)
	err := http.ListenAndServe(addr, r)
	if err != nil {
		log.Fatalf("Could not start webserver: %s", err)
	}
}
