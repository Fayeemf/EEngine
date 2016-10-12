module.exports = function(grunt) {

 grunt.initConfig({
    concat: {
      dist: {
        src: ['src/ee.js', 'src/**/*.js'],
        dest: 'build/ee.js'
      }
    },
    watch: {
      scripts: {
        files: 'src/**/*.js',
        tasks: ['concat:dist']
      },
    }
  })

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch')

  grunt.registerTask('default', ['watch:dist']);

}