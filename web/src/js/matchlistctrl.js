angular.module('lolkaiser').controller('MatchListCtrl', ['$scope', 'matchHistory', 'CONFIG', function($scope, matchHistory, CONFIG) {
	$scope.history = [];
	$scope.config = CONFIG;
	$scope.selections = {
		mapping: CONFIG.mappings[0],
		gametypes: CONFIG.gametypes
	};

	$scope.summoner = {
		server: CONFIG.servers[0].id,
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
			data = _.union(data, e.f($scope.history));	
		});
		if(filters.size() === 0) {
			data = $scope.history;
		}
		$scope.chart = $scope.selections.mapping.f(data);
	};
	$scope.$watch('history', $scope.updateChart.bind($scope));
	$scope.$watch('selections', $scope.updateChart.bind($scope), true);
}]);
