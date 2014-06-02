angular.module('lolkaiser').factory('matchHistory', ['$q', '$http', function($q, $http) {
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
}]);
