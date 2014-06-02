angular.module('lolkaiser').constant('MAPPINGS', [
	{
		name: 'Champions played over time',
		f: function(data) {
			var sliceWidth = 20;
			var champions = new Set();
			data.forEach(e => champions.add(e.championName))
			data = data
				.map(function(e, i, c) {
					return c.slice(i, i+sliceWidth);
				})
				.map(function(e) {
					return _(e).countBy('championName').__wrapped__;
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
										champion: e.championName,
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
	}]);
