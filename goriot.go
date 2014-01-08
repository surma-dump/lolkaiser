package main

import (
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/TrevorSStone/goriot"
	"github.com/garyburd/redigo/redis"
)

func GoRiotMatchHistory(sid string) ([]*Match, error) {
	elems := strings.Split(sid, "/")
	id, err := strconv.ParseInt(elems[1], 10, 64)
	if err != nil {
		return nil, err
	}

	games, err := goriot.RecentGameBySummoner(elems[0], id)
	if err != nil {
		return nil, err
	}

	matches := make([]*Match, 0, len(games))
	for _, game := range games {
		match := &Match{
			GameType: game.GameType,
			Date:     time.Unix(game.CreateDate/1000, 0),
			Win:      lookupStat(game.Statistics, "WIN") == 1,
			Length:   lookupStat(game.Statistics, "TIME_PLAYED") / 60,
			Teams:    splitTeams(elems[0], game.FellowPlayers, game.TeamID),

			Champion: lookupChampion(game.ChampionID),
			KDA: []int{
				lookupStat(game.Statistics, "CHAMPIONS_KILLED"),
				lookupStat(game.Statistics, "NUM_DEATHS"),
				lookupStat(game.Statistics, "ASSISTS"),
			},
			Gold:             lookupStat(game.Statistics, "GOLD_EARNED"),
			Minions:          lookupStat(game.Statistics, "MINIONS_KILLED"),
			LargestMultikill: lookupStat(game.Statistics, "LARGEST_MULTI_KILL"),
			TimeDead:         0,
		}
		matches = append(matches, match)
	}
	return matches, nil
}

func lookupStat(stats []goriot.GameStat, key string) int {
	for _, stat := range stats {
		if key == stat.Name {
			return stat.Value
		}
	}
	return 0
}

func splitTeams(region string, gplayers []goriot.Player, team int) [][]Player {
	players1 := make([]Player, 0, 5)
	players2 := make([]Player, 0, 5)
	for _, gplayer := range gplayers {
		player := Player{
			Champion:     lookupChampion(gplayer.ChampionID),
			SummonerName: lookupSummonerName(region, int(gplayer.SummonerID)),
		}
		if gplayer.TeamID == team {
			players1 = append(players1, player)
		} else {
			players2 = append(players2, player)
		}
	}
	return [][]Player{players1, players2}
}

func lookupChampion(id int) string {
	s, err := redis.String(db.Do("GET", fmt.Sprintf("champion:%d", id)))
	if err == nil {
		return s
	}
	champions, err := goriot.ChampionList(goriot.NA, false)
	if err != nil {
		log.Printf("Could not resolve champion ID: %s", err)
		return ""
	}
	for _, champion := range champions {
		if champion.ID == id {
			db.Do("SET", fmt.Sprintf("champion:%d", id), champion.Name)
			return champion.Name
		}
	}
	return ""
}

func lookupSummonerName(region string, id int) string {
	s, err := redis.String(db.Do("GET", fmt.Sprintf("summoner:%s:%d", region, id)))
	if err == nil {
		return s
	}

	summoner, err := goriot.SummonerByID(region, int64(id))
	if err != nil {
		log.Printf("Could not resolve summoner ID: %s", err)
		return ""
	}
	db.Do("SET", fmt.Sprintf("summoner:%s:%d", region, id), summoner.Name)
	return summoner.Name
}
