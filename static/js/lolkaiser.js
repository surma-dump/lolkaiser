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
		name: "Champion Stats",
		f: function(data) {
			return _(data)
				.reduce(function(acc, e){
					if(!acc.hasOwnProperty(e.champion)) {
						acc[e.champion] = {wins: 0, losses: 0, games: 0};
					}
					acc[e.champion].games += 1;
					acc[e.champion][e.win ? 'wins' : 'losses'] += 1;
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

	$scope.updateData = function() {
		$scope.data = JSON.stringify($scope.selectedView.f($scope.history), null, 2);
	}
	$scope.$watch('history', $scope.updateData.bind($scope));
	$scope.$watch('selectedView', $scope.updateData.bind($scope));
}])
