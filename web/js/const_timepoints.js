angular.module('lolkaiser').constant('TIMEPOINTS', [
	{
		name: 'Last 100 games',
		f: function(matches) {
			return matches.slice(0, 100);
		}
	}]);
