angular.module('lolkaiser').controller('MatchListCtrl', ['$scope', 'matchHistory', 'SERVERS', 'GAMETYPES', 'TIMEPOINTS', 'MAPPINGS', 'CHAMPIONSLUT', function($scope, matchHistory, SERVERS, GAMETYPES, TIMEPOINTS, MAPPINGS, CHAMPIONSLUT) {
	$scope.history = [];
	$scope.gametypes = GAMETYPES;
	$scope.timepoints = TIMEPOINTS;
	$scope.servers = SERVERS;
	$scope.mappings = MAPPINGS;
	$scope.gametypes[0].selected = true;
	$scope.timepoints[0].selected = true;
	$scope.selections = {
		mapping: $scope.mappings[0],
		gametypes: $scope.gametypes,
		timepoints: $scope.timepoints
	};


	$scope.summoner = {
		server: $scope.servers[0].id,
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

		data.map(e => {
			e.championId = CHAMPIONSLUT[e.championId];
			return e;
		});

		$scope.chart = $scope.selections.mapping.f(data);
	};
	$scope.$watch('history', $scope.updateChart.bind($scope));
	$scope.$watch('selections', $scope.updateChart.bind($scope), true);
}]);
