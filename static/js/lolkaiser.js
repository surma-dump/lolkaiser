angular.module('lolkaiser', [])
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
			return _(data)
				.reduce(function(acc, e){
					if(!acc.hasOwnProperty(e.champion)) {
						acc[e.champion] = {wins: 0, games: 0};
					}
					acc[e.champion].games++;
					acc[e.champion].wins += e.win ? 1 : 0;
					return acc;
				}, {})
		}
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
		refresh: function(server, summonerId) {
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

	$scope.summoner = {
		server: SERVERS[0].id,
	};

	$scope.hasHistory = function() {
		return !!$scope.history;
	}

	$scope.loadClick = function() {
		matchHistory.get($scope.summoner.server, $scope.summoner.id).then(function(history) {
			$scope.history = history;
		}, function(error) {
			console.log(error);
		});
	};

	$scope.updateData = function() {
		$scope.data = JSON.stringify($scope.selectedView.f($scope.history), null, 2);
	}
}])
