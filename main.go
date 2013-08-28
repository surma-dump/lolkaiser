package main

import (
	"encoding/json"
	"log"
	"os"
)

func main() {
	mh, err := MatchHistory(SERVER_EUW, os.Args[1])
	if err != nil {
		log.Fatalf("Could not get match history: %s", err)
	}
	data, _ := json.MarshalIndent(mh, "", "  ")
	os.Stdout.Write(data)
}
