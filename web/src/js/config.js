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
				return m.game_type == 'Ranked Solo 5v5';
			}
		},
		{
			name: 'Normal 5v5',
			f: function(m) {
				return m.game_type == 'Normal 5v5';
			}
		},
		{
			name: 'Team Builder',
			f: function(m) {
				return m.game_type == 'Team Builder';
			}
		},
		{
			name: 'Co-Op Vs AI',
			f: function(m) {
				return m.game_type == 'Co-Op Vs AI';
			}
		}
	],
	timepoints: [
		{
			name: 'Last 100 games',
			f: function(matches) {
				return matches.slice(0, 100);
			}
		},
		{
			name: 'After start of Season 3',
			f: function(matches) {
				return [for(m of matches) if(m.timestamp > '2013-02-01T00:00:00Z') m];
			}
		},
		{
			name: 'Before start of Season 4',
			f: function(matches) {
				return [for(m of matches) if(m.timestamp < '2014-01-17T00:00:00Z') m];
			}
		},
		{
			name: 'After start of Season 4',
			f: function(matches) {
				return [for(m of matches) if(m.timestamp > '2014-01-17T00:00:00Z') m];
			}
		}
	],
	mappings: [
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
									var idx = _(acc).findIndex({'champion': e.champion});
									if(idx == -1) {
										idx = acc.push({
											champion: e.champion,
											wins: 0,
											losses: 0,
											games: 0
										})-1;
									}
									acc[idx].games += 1;
									acc[idx][e.win ? 'wins' : 'losses'] += 1;
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
										.filter(e => e.win)
										.length/sliceWidth;
								})
								.map(function(e, i) {
									return [i, Math.floor(e*10000)/100];
								})
						}
					]
				}
			}
		},
		{
			name: 'Champions played over time',
			f: function(data) {
				var sliceWidth = 20;
				var champions = new Set();
				data.forEach(e => champions.add(e.champion))
				data = data
					.map(function(e, i, c) {
						return c.slice(i, i+sliceWidth);
					})
					.map(function(e) {
						return _(e).countBy('champion').__wrapped__;
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
		}
	]
});
