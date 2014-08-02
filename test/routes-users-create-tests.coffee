assert = require 'assert'
should = require 'should'

fixtures = require './support/fixtures'
loadServer = require './support/load-server'
setupServer = require './support/setup-server'

describe 'testing create users', ->
  server = null

  beforeEach (cb) ->
    loadServer (err,serverResult) ->
      server = serverResult
      cb err

  describe 'without server setup', ->
    describe 'POST /users', ->
      describe 'with invalid data', ->
        it 'should 400', (cb) ->
          options =
            method: "POST"
            url: "/users"
            payload: 
              username: 'mw'
              password: '12345678abc'
     
          server.inject options, (response) ->
            result = response.result

            response.statusCode.should.equal 400
            should.exist result
            cb null

  describe 'with server setup', ->
    beforeEach (cb) ->
      setupServer server,cb

    describe 'POST /users', ->
      describe 'with invalid data', ->

        it 'should return a 400', (cb) ->
          options =
            method: "POST"
            url: "/users"
            payload: 
              username: 'mw'
              password: '12345678abc'
     
          server.inject options, (response) ->
            result = response.result

            response.statusCode.should.equal 400
            should.exist result
      
            cb null

      describe 'with valid data', ->
        it 'should create a user and return a token', (cb) ->
          options =
            method: "POST"
            url: "/users"
            payload: 
              username: fixtures.user1.username
              password: fixtures.user1.password
              email: fixtures.user1.email
              name: fixtures.user1.name

          server.inject options, (response) ->
            result = response.result

            response.statusCode.should.equal 201
            should.exist result
            result.should.have.property "token"
            result.token.should.have.property "accessToken"
            result.token.should.have.property "refreshToken"
      
            cb null
