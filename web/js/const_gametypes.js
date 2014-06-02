angular.module('lolkaiser').constant('GAMETYPES', [
{
	name: 'Ranked Solo 5v5',
	f: function(m) {
		return m.subType == 'RANKED_SOLO_5x5';
	}
},
{
	name: 'Normal 5v5',
	f: function(m) {
		return m.subType == 'NORMAL';
	}
},
{
	name: 'Team Builder',
	f: function(m) {
		return m.subType == 'CAP_5x5';
	}
},
{
	name: 'Co-Op Vs AI',
	f: function(m) {
		return m.subType == 'BOT';
	}
}]);
