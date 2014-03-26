package main

import (
	"encoding/csv"
	"io"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/voxelbrain/goptions"

	"labix.org/v2/mgo"
	"labix.org/v2/mgo/bson"
)

var options = struct {
	MongoDB     string        `goptions:"-m, --mongodb, description='URL of MongoDB', obligatory"`
	SummonerId  string        `goptions:"-i, --id, description='ID of the summoner to import', obligatory"`
	Spreadsheet *os.File      `goptions:"-f, --file, rdonly, description='CSV version of the spreadsheet', obligatory"`
	Help        goptions.Help `goptions:"-h, --help, description='Show this help'"`
}{}

func main() {
	goptions.ParseAndFail(&options)

	session, err := mgo.Dial(options.MongoDB)
	if err != nil {
		log.Fatalf("Could not connect to MongoDB: %s", err)
	}
	db := session.DB("")

	r := csv.NewReader(options.Spreadsheet)
	r.FieldsPerRecord = -1

	matches := make([]Match, 0)

	for {
		fields, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Fatalf("Could not read file: %s", err)
		}
		match := Match{
			Win:      fields[0] == "win",
			Date:     mustTime(fields[1]),
			GameType: fields[2],
			Length:   mustInt(fields[3]),
			KDA: []int{
				mustInt(fields[4]),
				mustInt(fields[5]),
				mustInt(fields[6]),
			},
			Gold:             mustInt(fields[7]),
			Minions:          mustInt(fields[8]),
			LargestMultikill: mustInt(fields[9]),
			TimeDead:         mustInt(fields[10]),
			Teams: [][]Player{
				make([]Player, 5),
				make([]Player, 5),
			},
			Champion: fields[11],
		}
		for i := 0; i < 5; i++ {
			match.Teams[0][i].Champion = fields[11+2*i+0]
			match.Teams[0][i].SummonerName = fields[11+2*i+1]
		}
		for i := 0; i < 5; i++ {
			match.Teams[1][i].Champion = fields[21+2*i+0]
			match.Teams[1][i].SummonerName = fields[21+2*i+1]
		}
		matches = append(matches, match)
	}

	c := db.C(options.SummonerId)
	for _, m := range matches {
		_, err := c.Upsert(bson.M{
			"timestamp": m.Date,
		}, m)
		if err != nil {
			log.Fatalf("Update failed: %s", err)
			return
		}
	}
}

func mustInt(s string) int {
	i, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		panic(err)
	}
	return int(i)
}

func mustTime(s string) time.Time {
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		panic(err)
	}
	return t
}
