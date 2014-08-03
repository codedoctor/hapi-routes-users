assert = require 'assert'
should = require 'should'

fixtures = require './support/fixtures'
loadServer = require './support/load-server'
setupServer = require './support/setup-server'
setupUsers = require './support/setup-users'

describe 'testing user get', ->
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

      describe 'against /users/me with no scope', ->
        describe 'GET with auth', ->
          it 'should return 200', (cb) ->
            options =
              method: "GET"
              url: "/users/me"
              credentials: fixtures.user1
            server.inject options, (response) ->
              result = response.result

              response.statusCode.should.equal 200
              console.log JSON.stringify(result)
              should.exist result
        
              cb null
