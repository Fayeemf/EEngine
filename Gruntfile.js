module.exports = function(grunt) {

 grunt.initConfig({
    concat: {
      dist: {
        src: [
          "src/ee.js",
          "src/utils/*.js",
          "src/tilemap/*.js",
          "src/shapes/*.js",
          "src/input/*.js",
          "src/graphic/*.js",
          "src/geom/*.js",
          "src/core/Animator.js",
          "src/core/Camera.js",
          "src/core/EntityType.js",
          "src/core/Loader.js",
          "src/core/Quadtree.js",
          "src/core/Game.js"
        ],
        dest: 'build/ee.js'
      }
    },
    watch: {
      scripts: {
        files: 'src/**/*.js',
        tasks: ['concat:dist']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', ['watch:dist']);

};