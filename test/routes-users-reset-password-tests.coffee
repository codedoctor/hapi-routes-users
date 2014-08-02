assert = require 'assert'
should = require 'should'

fixtures = require './support/fixtures'
loadServer = require './support/load-server'
setupServer = require './support/setup-server'
setupUsers = require './support/setup-users'

describe 'testing reset password', ->
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

      describe 'POST /users/reset-password', ->
        describe 'with invalid data', ->
          it 'should return a 400', (cb) ->
            options =
              method: "POST"
              url: "/users/reset-password"
              payload: {} 
            server.inject options, (response) ->
              result = response.result

              response.statusCode.should.equal 400
              should.exist result
        
              cb null

        describe 'with valid data', ->
          it 'POST with valid data should create a password reset token', (cb) ->
            options =
              method: "POST"
              url: "/users/reset-password"
              payload: 
                login: fixtures.user1.email

            server.inject options, (response) ->
              result = response.result

              response.statusCode.should.equal 201
              should.exist result
              result.should.have.property "token"
        
              cb null

      describe 'POST /users/reset-password-tokens', ->
        describe 'applying a valid token and password', ->
          it 'should reset it', (cb) ->
            options =
              method: "POST"
              url: "/users/reset-password"
              payload: 
                login: fixtures.user1.email

            server.inject options, (response) ->
              result = response.result

              response.statusCode.should.equal 201
              should.exist result
        
              options =
                method: "POST"
                url: "/users/reset-password/tokens"
                payload: 
                  token: result.token
                  password: fixtures.validPassword 

              server.inject options, (response) ->
                result = response.result

                response.statusCode.should.equal 200
                should.exist result

                cb null


