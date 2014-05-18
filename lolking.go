package main

import (
	"fmt"
	"github.com/PuerkitoBio/goquery"
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
		return time.Unix(0, 0)
	},
	"champion": func(s *goquery.Selection) interface{} {
		return s.Find(".match-details-cell-body .match-summoner-details-champion a").Text()
	},
	"win": func(s *goquery.Selection) interface{} {
		return s.Find(".match-details-cell-header > div:nth-child(4) > div:nth-child(1)").Text() == "WIN"
	},
	"game_type": func(s *goquery.Selection) interface{} {
		node := s.Find(".match-details-cell-header > div:nth-child(1) > div:nth-child(1)")
		return strings.TrimSpace(node.Text())
	},
	"length": func(s *goquery.Selection) interface{} {
		node := s.Find(".match-details-cell-header > div:nth-child(3) > div:nth-child(1)").Text()
		length, _ := strconv.ParseInt(strings.TrimSuffix(node, " Minutes"), 10, 64)
		return int(length)
	},
	"kda": func(s *goquery.Selection) interface{} {
		node := s.Find(".match-details-cell-body .match-summoner-details-champion + div .match_details_cell-stats strong")
		kda := make([]int, 0, 3)
		node.Each(func(_ int, s *goquery.Selection) {
			v, _ := strconv.ParseInt(s.Text(), 10, 64)
			kda = append(kda, int(v))
		})
		return kda
	},
	"gold": func(s *goquery.Selection) interface{} {
		node := s.Find(".match-details-cell-body .match-summoner-details-champion + div .match_details_cell-extra_stats > div:nth-child(1) strong")
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
		node := s.Find(".match-details-cell-body .match-summoner-details-champion + div .match_details_cell-extra_stats > div:nth-child(2) strong")
		v, _ := strconv.ParseInt(strings.TrimSpace(node.Text()), 10, 64)
		return int(v)
	},
	"teams": func(s *goquery.Selection) interface{} {
		node := s.Find(".match-details-cell-body .match-details-table")
		node1 := node.Find("tr:nth-child(3), tr:nth-child(4), tr:nth-child(5), tr:nth-child(6), tr:nth-child(7)")
		node2 := node.Find("tr:nth-child(10), tr:nth-child(11), tr:nth-child(12), tr:nth-child(13), tr:nth-child(14)")

		team := make([]Player, 0, 5)
		f := func(_ int, s *goquery.Selection) {
			champ := ""
			summoner := s.Find(".summoner-name a").Text()
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
		return 0
	},
	"time_dead": func(s *goquery.Selection) interface{} {
		return 0
	},
}

func LolKingMatchHistory(id string) ([]*Match, error) {
	url := "http://" + path.Join(baseUrl, id)
	doc, err := goquery.NewDocument(url)
	if err != nil {
		return nil, fmt.Errorf("Could not get summoner document: %s", err)
	}

	r := make([]*Match, 0)
	sel := doc.Find(".match-details-cell")
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
