angular.module('lolkaiser', ['angularCharts'])
.constant('SERVERS', [
	{
		id: 'euw',
		name: 'Europe West'
	},
	{
		id: 'na',
		name: 'North America'
	}
])
.constant('VIEWS', [
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
					data: _(data)
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
							return {
								x: e.champion,
								y: [Math.floor(e.wins/e.games*10000)/100]
							};
						})
				}
			};
		},
	}
])
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
.controller('MatchListCtrl', ['$scope', 'matchHistory', 'SERVERS', 'VIEWS', function($scope, matchHistory, SERVERS, VIEWS) {
	$scope.servers = SERVERS;
	$scope.views = VIEWS;
	$scope.selectedView = VIEWS[0];

	$scope.summoner = {
		server: SERVERS[0].id,
		isValid: false,
	};


	$scope.hasHistory = function() {
		return !!$scope.history;
	}

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
			})
	}

	$scope.updateChart = function() {
		$scope.chart = $scope.selectedView.f($scope.history);
	}
	$scope.$watch('history', $scope.updateChart.bind($scope));
	$scope.$watch('selectedView', $scope.updateChart.bind($scope));
}])
