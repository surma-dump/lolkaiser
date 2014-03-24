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
          }
        ]
      }
    },

    usemin: {
      html: 'dist/index.html'
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-usemin');

  grunt.registerTask('default', ['copy:html', 'useminPrepare', 'concat', 'uglify', 'usemin']);
  grunt.registerTask('dev', ['copy:html', 'useminPrepare', 'concat', 'copy:tmp', 'usemin']);

};