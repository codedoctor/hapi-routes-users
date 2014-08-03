assert = require 'assert'
should = require 'should'

fixtures = require './support/fixtures'
loadServer = require './support/load-server'
setupServer = require './support/setup-server'
setupUsers = require './support/setup-users'

describe 'testing change password', ->
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

      describe 'against /users with no scope', ->
        describe 'GET with auth', ->
          it 'should return 200', (cb) ->
            options =
              method: "GET"
              url: "/users"
              credentials: fixtures.credentials
            server.inject options, (response) ->
              result = response.result

              response.statusCode.should.equal 200
              should.exist result
        
              cb null
