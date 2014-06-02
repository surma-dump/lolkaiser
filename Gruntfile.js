module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    traceur: {
      options: {},
      js: {
        files: [
          {
            expand: true,
            cwd: 'web',
            src: [
              'js/**/*.js'
            ],
            dest: '.tmp/traceur'
          }
        ]
      }
    },

    concat: {
      traceur: {
        src: [
          '.tmp/traceur/js/lolkaiser.js',
          '.tmp/traceur/js/const_*.js',
          '.tmp/traceur/js/matchhistory.js',
          '.tmp/traceur/js/matchlistctrl.js'
        ],
        dest: '.tmp/concat/traceur/main.js',
      },
      js: {
        src: [
          'bower_components/es6-shim/es6-shim.js',
          'node_modules/grunt-traceur/node_modules/traceur/src/runtime/runtime.js',
          'bower_components/lodash/dist/lodash.js',
          'bower_components/angular/angular.js',
          'bower_components/d3/d3.js',
          'bower_components/nvd3/nv.d3.js',
          'bower_components/angularjs-nvd3-directives/dist/angularjs-nvd3-directives.js',
          '.tmp/concat/traceur/main.js'
        ],
        dest: '.tmp/concat/js/main.js'
      },
      css: {
        src: [
          'bower_components/nvd3/nv.d3.css'
        ],
        dest: '.tmp/concat/css/style.css'
      }
    },

    uglify: {
      options: {},
      js: {
        files: [
          {
            expand: true,
            cwd: '.tmp/concat/js/',
            src: '**/*.js',
            dest: '.tmp/uglify'
          }
        ]
      }
    },

    cssmin: {
      options: {},
      css: {
        files: [
          {
            expand: true,
            cwd: '.tmp/concat/css',
            src: '**/*.css',
            dest: '.tmp/cssmin'
        }
        ]
      }
    },

    copy: {
      html: {
        files: [
          {
            expand: true,
            cwd: 'web',
            src: '**/*.html',
            dest: 'dist/'
          }
        ]
      },
      tmpjs: {
        files: [
          {
            expand: true,
            cwd: '.tmp/concat/js',
            src: '**/*.js',
            dest: 'dist/js'
          }
        ]
      },
      js: {
        files: [
          {
            expand: true,
            cwd: '.tmp/uglify',
            src: '**/*.js',
            dest: 'dist/js'
          }
        ]
      },
      css: {
        files: [
          {
            expand: true,
            cwd: '.tmp/cssmin',
            src: '**/*.css',
            dest: 'dist/css'
          }
        ]
      },
      tmpcss: {
        files: [
          {
            expand: true,
            cwd: '.tmp/concat/css',
            src: '**/*.css',
            dest: 'dist/css'
          }
        ]
      }
    },

    watch: {
      scripts: {
        files: ['web/**'],
        tasks: ['dev'],
        atBegin: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-traceur');

  grunt.registerTask('build', ['traceur', 'concat', 'uglify', 'cssmin', 'copy:html', 'copy:css', 'copy:js']);
  grunt.registerTask('dev', ['traceur', 'concat', 'copy:html', 'copy:tmpcss', 'copy:tmpjs']);
  grunt.registerTask('server', ['dev', 'watch']);
  grunt.registerTask('heroku', ['build']);
  grunt.registerTask('default', ['build']);
};
