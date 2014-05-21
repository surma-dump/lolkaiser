angular.module('lolkaiser').constant('CONFIG', {
	servers: [
		{
			id: 'euw',
			name: 'Europe West'
		},
		{
			id: 'na',
			name: 'North America'
		}
	],
	gametypes: [
		{
			name: 'Ranked Solo 5v5',
			f: function(m) {
				return m.subType == 'RANKED_SOLO_5x5';
			}
		},
		{
			name: 'Normal 5v5',
			f: function(m) {
				return m.subType == 'NORMAL';
			}
		},
		{
			name: 'Team Builder',
			f: function(m) {
				return m.subType == 'CAP_5x5';
			}
		},
		{
			name: 'Co-Op Vs AI',
			f: function(m) {
				return m.subType == 'BOT';
			}
		}
	],
	timepoints: [
		{
			name: 'Last 100 games',
			f: function(matches) {
				return matches.slice(0, 100);
			}
		}
	],
	mappings: [
		{
			name: 'Champions played over time',
			f: function(data) {
				var sliceWidth = 20;
				var champions = new Set();
				data.forEach(e => champions.add(e.championId))
				data = data
					.map(function(e, i, c) {
						return c.slice(i, i+sliceWidth);
					})
					.map(function(e) {
						return _(e).countBy('championId').__wrapped__;
					});

				result = [];
				champions.forEach(function(c) {
					result.push({
						key: c,
						values: data.map(function(e, i) {
							return [i, e[c] || 0];
						})
					});
				})
				return {
					type: 'stacked-area',
					style: 'expand',
					c: champions,
					data: result
				};
			},
		},
		{
			name: 'Win rate per Champion',
			f: function(data) {
				return {
					type: 'horizontal-bar',
					data: [
						{
							key: 'Win rate per Champion',
							values: _(data)
								.reduce(function(acc, e){
									var idx = _(acc).findIndex({'champion': e.championId});
									if(idx == -1) {
										idx = acc.push({
											champion: e.championId,
											wins: 0,
											losses: 0,
											games: 0
										})-1;
									}
									acc[idx].games += 1;
									acc[idx][e.stats.win ? 'wins' : 'losses'] += 1;
									return acc;
								}, [])
								.map(function(e) {
									return [
										e.champion,
										Math.floor(e.wins/e.games*10000)/100
									];
								})
						}
					]
				};
			},
		},
		{
			name: 'Win rate over time',
			f: function(matches) {
				var sliceWidth = 20;
				return {
					type: 'line',
					data: [
						{
							key: 'Win rate over time',
							values: matches
								.map(function(e, i, c) {
									return c.slice(i, i+sliceWidth);
								})
								.filter(e => e.length == sliceWidth)
								.map(function(e) {
									return e
										.filter(e => e.stats.win)
										.length/sliceWidth;
								})
								.map(function(e, i) {
									return [i, Math.floor(e*10000)/100];
								})
						}
					]
				}
			}
		}
	]
});
