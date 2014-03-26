package main

import (
	"time"
)

type Match struct {
	GameType string     `json:"game_type" lolkaiser:"game_type" bson:"game_type"`
	Date     time.Time  `json:"timestamp" lolkaiser:"timestamp" bson:"timestamp"`
	Win      bool       `json:"win" lolkaiser:"win" bson:"win"`
	Length   int        `json:"length" lolkaiser:"length" bson:"length"`
	Teams    [][]Player `json:"teams" lolkaiser:"teams" bson:"teams"`

	Champion         string `json:"champion" lolkaiser:"champion" bson:"champion"`
	KDA              []int  `json:"kda" lolkaiser:"kda" bson:"kda"`
	Gold             int    `json:"gold" lolkaiser:"gold" bson:"gold"`
	Minions          int    `json:"minions" lolkaiser:"minions" bson:"minions"`
	LargestMultikill int    `json:"largest_multikill" lolkaiser:"largest_multikill" bson:"largest_multikill"`
	TimeDead         int    `json:"time_dead" lolkaiser:"time_dead" bson:"time_dead"`
}

type Player struct {
	Champion     string `json:"champion" bson:"champion"`
	SummonerName string `json:"summoner_name" bson:"summoner_name"`
}
