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

      describe 'using me (/users/me/password)', ->
        describe 'PUT with no auth but valid payload', ->
          it 'should return 401', (cb) ->
            options =
              method: "PUT"
              url: "/users/me/password"
              payload: 
                password: fixtures.validPassword
            server.inject options, (response) ->
              result = response.result

              response.statusCode.should.equal 401
              should.exist result
        
              cb null

        describe 'PUT with auth and invalid payload', ->
          it 'should return 400', (cb) ->
            options =
              method: "PUT"
              url: "/users/me/password"
              payload: {} 
              credentials: fixtures.credentials
            server.inject options, (response) ->
              result = response.result

              response.statusCode.should.equal 400
              should.exist result
        
              cb null

        describe 'PUT with auth and valid payload', ->
          it 'should return 204', (cb) ->
            options =
              method: "PUT"
              url: "/users/me/password"
              payload:
                password: fixtures.validPassword
              credentials: fixtures.user1
            server.inject options, (response) ->
              result = response.result

              response.statusCode.should.equal 204
        
              cb null
