angular.module('lolkaiser', ['angularCharts'])
.constant('INPUT', {
	"servers": [
		{
			id: 'euw',
			name: 'Europe West'
		},
		{
			id: 'na',
			name: 'North America'
		}
	],
	"gametypes": [
		{
			name: "Normal 5v5",
			f: function(data) {
				return _(data)
					.filter(function(e) {
						return e.game_type == "Normal 5v5";	
					})
					.__wrapped__;
			}
		},
		{
			name: "Ranked Solo 5v5",
			f: function(data) {
				return _(data)
					.filter(function(e) {
						return e.game_type == "Ranked Solo 5v5";	
					})
					.__wrapped__;
			}
		},
		{
			name: "Co-Op Vs AI",
			f: function(data) {
				return _(data)
					.filter(function(e) {
						return e.game_type == "Co-Op Vs AI";	
					})
					.__wrapped__;
			}
		}
	],
	"timepoints": [
		{
			name: "After start of Season 3",
			f: function(data) {
				return _(data)
					.filter(function(e) {
						return e.timestamp > "2013-02-01T00:00:00Z";
					})
					.__wrapped__;
			}
		},
		{
			name: "Before start of Season 4",
			f: function(data) {
				return _(data)
					.filter(function(e) {
						return e.timestamp < "2013-01-17T00:00:00Z";
					})
					.__wrapped__;
			}
		},
		{
			name: "After start of Season 4",
			f: function(data) {
				return _(data)
					.filter(function(e) {
						return e.timestamp > "2013-01-17T00:00:00Z";
					})
					.__wrapped__;
			}
		},
		{
			name: "Last 50 games",
			f: function(data) {
				return _(data)
					.sortBy("timestamp")
					.last(50)
					.__wrapped__;
			}
		}
	],
	"mappings": [
		{
			name: "Win rate per Champion",
			f: function(data) {
				return {
					type: 'bar',
					config: {
						title: 'Winrate per Champion',
						tooltips: true,
						labels: false,
					},
					data: {
						series: ["Champion"],
						data: _(_(data)
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
							}, []))
							.map(function(e) {
								return {
									x: e.champion,
									y: [Math.floor(e.wins/e.games*10000)/100]
								};
							})
							.__wrapped__
					}
				};
			},
		}
	]
})
.factory('matchHistory', ['$q', '$http', function($q, $http) {
	return {
		get: function(server, summonerId) {
			return $http({
				url: '/'+server+'/'+summonerId,
				method: 'GET'
			}).then(function(result) {
				if(result.status != 200) {
					return $q.reject(result.data);
				}
				return result.data;
			});
		},
		update: function(server, summonerId) {
			return $http({
				url: '/'+server+'/'+summonerId,
				method: 'POST'
			}).then(function(result) {
				if(result.status != 204) {
					return $q.reject(result.data);
				}
				return true;
			});
		}
	};	
}])
.controller('MatchListCtrl', ['$scope', 'matchHistory', 'INPUT', function($scope, matchHistory, INPUT) {
	$scope.history = [];
	$scope.input = INPUT;
	$scope.selections = {
		mapping: $scope.input.mappings[0],
		gametypes: INPUT.gametypes
	};

	$scope.summoner = {
		server: $scope.input.servers[0].id,
		isValid: false,
	};


	$scope.hasHistory = function() {
		return !!$scope.history;
	};

	$scope.loadClick = function() {
		matchHistory.get($scope.summoner.server, $scope.summoner.id).then(function(history) {
			$scope.history = history;
			$scope.summoner.isValid = true;
		}, function(error) {
			console.log(error);
			$scope.summoner.isValid = false;
		});
	};

	$scope.updateClick = function() {
		if(!$scope.summoner.isValid) {
			return;
		}
		matchHistory.update($scope.summoner.server, $scope.summoner.id)
			.then(matchHistory.get.bind(matchHistory, $scope.summoner.server, $scope.summoner.id))
			.then(function(history) {
				$scope.history = history;
			});
	};

	$scope.updateChart = function() {
		var data = [];
		var filters = _($scope.selections.gametypes).filter('selected');
		filters.forEach(function(e) {
			console.log(e.f($scope.history));
			data = _.union(data, e.f($scope.history));	
		});
		if(filters.size() === 0) {
			data = $scope.history;
		}
		$scope.chart = $scope.selections.mapping.f(data);
	};
	$scope.$watch('history', $scope.updateChart.bind($scope));
	$scope.$watch('selections', $scope.updateChart.bind($scope), true);
}])
