package main

import (
	"fmt"
	"github.com/PuerkitoBio/goquery"
	"log"
	"path"
	"reflect"
	"strconv"
	"strings"
	"time"
)

const (
	baseUrl = "www.lolking.net/summoner/"
)

type FieldExtractor func(s *goquery.Selection) interface{}

var Extractors = map[string]FieldExtractor{
	"timestamp": func(s *goquery.Selection) interface{} {
		timestamp, _ := s.Find("div:nth-child(1) > div.match_details_cell:nth-child(2) > div:nth-child(1) > div:nth-child(3) > span").Attr("data-hoverswitch")
		t, err := time.Parse("1/2/06 3:04PM MST", timestamp)
		if err != nil {
			log.Printf("Invalid timestamp %s: %s", timestamp, err)
		}
		return t
	},
	"champion": func(s *goquery.Selection) interface{} {
		return extractChampion(s.Find("div:nth-child(1) > div.match_details_cell:nth-child(1) > div:nth-child(1) > div:nth-child(1) > a"))
	},
	"win": func(s *goquery.Selection) interface{} {
		return s.HasClass("match_win")
	},
	"game_type": func(s *goquery.Selection) interface{} {
		node := s.Find("div:nth-child(1) > div.match_details_cell:nth-child(2) > div:nth-child(1) > div:nth-child(1)")
		return strings.TrimSpace(node.Text())
	},
	"length": func(s *goquery.Selection) interface{} {
		node := s.Find("div:nth-child(1) > div.match_details_cell:nth-child(3) > div:nth-child(1) > strong").Text()
		length, _ := strconv.ParseInt(strings.TrimSuffix(node, " mins"), 10, 64)
		return int(length)
	},
	"kda": func(s *goquery.Selection) interface{} {
		node := s.Find("div:nth-child(1) > div.match_details_cell:nth-child(4) > div:nth-child(1) > strong")
		kda := make([]int, 0, 3)
		node.Each(func(_ int, s *goquery.Selection) {
			v, _ := strconv.ParseInt(s.Text(), 10, 64)
			kda = append(kda, int(v))
		})
		return kda
	},
	"gold": func(s *goquery.Selection) interface{} {
		node := s.Find("div:nth-child(1) > div.match_details_cell:nth-child(5) > div:nth-child(1) > strong")
		textVal := strings.TrimSpace(node.Text())
		multiplier := 1.0
		if strings.HasSuffix(textVal, "k") {
			multiplier = 1000.0
			textVal = textVal[0 : len(textVal)-1]
		}
		v, _ := strconv.ParseFloat(textVal, 64)
		return int(v * multiplier)
	},
	"minions": func(s *goquery.Selection) interface{} {
		node := s.Find("div:nth-child(1) > div.match_details_cell:nth-child(6) > div:nth-child(1) > strong")
		v, _ := strconv.ParseInt(strings.TrimSpace(node.Text()), 10, 64)
		return int(v)
	},
	"teams": func(s *goquery.Selection) interface{} {
		node1 := s.Find("div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > table td:nth-child(1) table tr:not(:nth-child(1))")
		node2 := s.Find("div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > table td:nth-child(3) table tr:not(:nth-child(1))")

		team := make([]Player, 0, 5)
		f := func(_ int, s *goquery.Selection) {
			champ := extractChampion(s.Find("td:nth-child(1) a"))
			summoner := s.Find("td:nth-child(2)").Text()
			team = append(team, Player{
				Champion:     champ,
				SummonerName: summoner,
			})
		}

		r := [][]Player{make([]Player, 5), make([]Player, 5)}

		node1.Each(f)
		copy(r[0], team)

		team = team[0:0]

		node2.Each(f)
		copy(r[1], team)

		return r
	},
	"largest_multikill": func(s *goquery.Selection) interface{} {
		node := s.Find("div:nth-child(2) > div:nth-child(1) > div:nth-child(2) tr:nth-child(4) td:nth-child(2)")
		v, _ := strconv.ParseInt(node.Text(), 10, 64)
		return int(v)
	},
	"time_dead": func(s *goquery.Selection) interface{} {
		node := s.Find("div:nth-child(2) > div:nth-child(1) > div:nth-child(2) tr:nth-child(5) td:nth-child(2)")
		v, _ := strconv.ParseInt(node.Text(), 10, 64)
		return int(v)
	},
}

func extractChampion(s *goquery.Selection) string {
	href, _ := s.Attr("href")
	elems := strings.Split(href, "/")
	return elems[len(elems)-1]
}

type LoLServer string

func (s LoLServer) String() string {
	return string(s)
}

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

func MatchHistory(id string) ([]*Match, error) {
	url := "http://" + path.Join(baseUrl, id)
	doc, err := goquery.NewDocument(url)
	if err != nil {
		return nil, fmt.Errorf("Could not get summoner document: %s", err)
	}

	r := make([]*Match, 0)
	sel := doc.Find(".pane_inner > .match_loss, .pane_inner > .match_win")
	sel.Each(func(_ int, s *goquery.Selection) {
		r = append(r, ConvertMatch(s))
	})
	return r, nil
}

func ConvertMatch(s *goquery.Selection) *Match {
	match := &Match{}
	vMatch := reflect.ValueOf(match).Elem()
	for i := 0; i < vMatch.Type().NumField(); i++ {
		f := vMatch.Type().Field(i)
		v := Extractors[f.Tag.Get("lolkaiser")](s)
		vMatch.Field(i).Set(reflect.ValueOf(v))
	}
	return match
}
