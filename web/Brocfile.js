module.exports = function (broccoli) {
	var tree = broccoli.makeTree('src/js');

	var compileES6 = require('broccoli-es6-concatenator');
	tree = compileES6(tree, {
		loaderFile: 'loader.js',
		inputFiles: [
			'someModule.js',
			'someDirective.js'
		],
		outputFile: '/js/app.js'
	});

	var traceur = require ('broccoli-traceur');
	tree = traceur(tree);

	return [tree];
};