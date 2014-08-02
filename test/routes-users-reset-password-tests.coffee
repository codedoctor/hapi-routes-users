assert = require 'assert'
should = require 'should'

fixtures = require './support/fixtures'
loadServer = require './support/load-server'
setupServer = require './support/setup-server'
setupUsers = require './support/setup-users'

describe 'WHEN testing reset password', ->
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

      it 'POST with invalid data should return a 400', (cb) ->
        options =
          method: "POST"
          url: "/users/reset-password"
          payload: {} 
        server.inject options, (response) ->
          result = response.result

          response.statusCode.should.equal 400
          should.exist result
    
          cb null

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

      it 'POST applying a valid token and password should reset it', (cb) ->
        options =
          method: "POST"
          url: "/users/reset-password"
          payload: 
            login: fixtures.user1.email

        server.inject options, (response) ->
          result = response.result

          response.statusCode.should.equal 201
          should.exist result
    
          console.log result.token
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


