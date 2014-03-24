module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    useminPrepare: {
      options: {
        dest: 'dist'
      },
      html: 'src/index.html'
    },

    copy: {
      html: {
        files: [
          {
            expand: true,
            cwd: 'src',
            src: '**/*.html',
            dest: 'dist/'
          }
        ]
      },
      tmp: {
        files: [
          {
            expand: true,
            cwd: '.tmp/concat',
            src: '**/*.js',
            dest: 'dist'
          },
          {
            expand: true,
            cwd: '.tmp/concat',
            src: '**/*.css',
            dest: 'dist'
          }
        ]
      }
    },

    usemin: {
      html: 'dist/index.html'
    },

    watch: {
      scripts: {
        files: ['src/**'],
        tasks: ['dev'],
        interrupt: true,
        atBegin: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-usemin');

  grunt.registerTask('default', ['copy:html', 'useminPrepare', 'concat', 'uglify', 'cssmin', 'usemin']);
  grunt.registerTask('dev', ['copy:html', 'useminPrepare', 'concat', 'copy:tmp', 'usemin']);

};