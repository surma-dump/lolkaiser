angular.module('lolkaiser').controller('MatchListCtrl', ['$scope', 'matchHistory', 'CONFIG', function($scope, matchHistory, CONFIG) {
	$scope.history = [];
	$scope.config = CONFIG;
	CONFIG.gametypes[0].selected = true;
	CONFIG.timepoints[0].selected = true;
	$scope.selections = {
		mapping: CONFIG.mappings[0],
		gametypes: CONFIG.gametypes,
		timepoints: CONFIG.timepoints
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
			.then((history) => {
				console.log('Got it', history);
				$scope.history = history;
			});
	};

	$scope.updateChart = function() {
		var filters = $scope.selections.gametypes.filter(e => e.selected);
		var data = $scope.history.filter(m => {
			return filters.map(e => e.f(m)).indexOf(true) != -1;
		})
		if(filters.length === 0) {
			data = $scope.history;
		}

		$scope.selections.timepoints
			.filter(e => e.selected)
			.forEach(e => {data = e.f(data)});

		$scope.chart = $scope.selections.mapping.f(data);
	};
	$scope.$watch('history', $scope.updateChart.bind($scope));
	$scope.$watch('selections', $scope.updateChart.bind($scope), true);
}]);
