assert = require 'assert'
should = require 'should'

fixtures = require './support/fixtures'
loadServer = require './support/load-server'
setupServer = require './support/setup-server'
setupUsers = require './support/setup-users'

describe 'testing user delete', ->
  server = null

  beforeEach (cb) ->
    loadServer (err,serverResult) ->
      server = serverResult
      cb err

  describe 'with server setup', ->
    beforeEach (cb) ->
      setupServer server,cb

    describe 'with user setup', ->
      beforeEach (cb) ->
        setupUsers server,cb

      describe 'using me (/users/me)', ->
        describe 'DELETE with no auth', ->
          it 'should return 401', (cb) ->
            options =
              method: "DELETE"
              url: "/users/me"
            server.inject options, (response) ->
              result = response.result

              response.statusCode.should.equal 401
              should.exist result
        
              cb null


        describe 'DELETE with auth', ->
          it 'should return 204', (cb) ->
            options =
              method: "DELETE"
              url: "/users/me"
              payload:
                password: fixtures.validPassword
              credentials: fixtures.user1
            server.inject options, (response) ->
              result = response.result

              response.statusCode.should.equal 204
        
              cb null
