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
			name: 'Normal 5v5',
			f: function(data) {
				return _(data)
					.filter(function(e) {
						return e.game_type == 'Normal 5v5';
					})
					.__wrapped__;
			}
		},
		{
			name: 'Ranked Solo 5v5',
			f: function(data) {
				return _(data)
					.filter(function(e) {
						return e.game_type == 'Ranked Solo 5v5';
					})
					.__wrapped__;
			}
		},
		{
			name: 'Co-Op Vs AI',
			f: function(data) {
				return _(data)
					.filter(function(e) {
						return e.game_type == 'Co-Op Vs AI';
					})
					.__wrapped__;
			}
		}
	],
	timepoints: [
		{
			name: 'After start of Season 3',
			f: function(data) {
				return _(data)
					.filter(function(e) {
						return e.timestamp > '2013-02-01T00:00:00Z';
					})
					.__wrapped__;
			}
		},
		{
			name: 'Before start of Season 4',
			f: function(data) {
				return _(data)
					.filter(function(e) {
						return e.timestamp < '2013-01-17T00:00:00Z';
					})
					.__wrapped__;
			}
		},
		{
			name: 'After start of Season 4',
			f: function(data) {
				return _(data)
					.filter(function(e) {
						return e.timestamp > '2013-01-17T00:00:00Z';
					})
					.__wrapped__;
			}
		},
		{
			name: 'Last 50 games',
			f: function(data) {
				return _(data)
					.sortBy('timestamp')
					.last(50)
					.__wrapped__;
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
			f: function(data) {
				var sliceWidth = 20;
				return {
					type: 'line',
					data: [
						{
							key: 'Win rate over time',
							values: _(data)
								.sortBy('timestamp')
								.reverse()
								.map(function(e, i, c) {
									return c.slice(i, i+sliceWidth);
								})
								.filter(function(e) {
									return _(e).size() == sliceWidth;
								})
								.map(function(e) {
									return _(e).filter('win').size()/sliceWidth;
								})
								.map(function(e, i) {
									return [i, Math.floor(e*10000)/100];
								})
								.__wrapped__
						}
					]
				}
			}
		},
		{
			name: 'Champions played over time',
			f: function(data) {
				var sliceWidth = 20;
				var champions = _(data).map('champion').uniq().__wrapped__;
				data = _(data)
					.sortBy('timestamp')
					.reverse()
					.map(function(e, i, c) {
						return c.slice(i, i+sliceWidth);
					})
					.map(function(e) {
						return _(e).countBy('champion').__wrapped__;
					})
					.__wrapped__

				return {
					type: 'stacked-area',
					style: 'expand',
					c: champions,
					data: _(champions).map(function(c) {
						return {
							key: c,
							values: _(data).map(function(e, i) {
								return [i, e[c] || 0];
							}).__wrapped__
						}
					})
					.__wrapped__
				};
			},
		}
	]
});
