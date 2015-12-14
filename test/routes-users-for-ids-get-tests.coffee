assert = require 'assert'
should = require 'should'

fixtures = require './support/fixtures'
loadServer = require './support/load-server'
setupServer = require './support/setup-server'
setupUsers = require './support/setup-users'

describe 'routes-users-for-ids-get-tests', ->
  server = null

  beforeEach (cb) ->
    loadServer (err,serverResult) ->
      return cb err if err
      server = serverResult

      setupServer server, (err) ->
        return cb err if err
        setupUsers server, (err) ->
          cb err

  describe '/users/for-ids', ->
    it 'WITH NO Ids it should return 200', (cb) ->
      options =
        method: "GET"
        url: "/users/for-ids"
        credentials: fixtures.user1
      server.inject options, (response) ->
        result = response.result

        response.statusCode.should.equal 200
        should.exist result
  
        cb null

  describe '/users/for-ids', ->
    it 'WITH EMPTY ids it should return 200', (cb) ->
      options =
        method: "GET"
        url: "/users/for-ids?ids="
        credentials: fixtures.user1
      server.inject options, (response) ->
        result = response.result

        response.statusCode.should.equal 200
        should.exist result
  
        cb null


  describe '/users/for-ids', ->
    it 'WITH ONE ID ids it should return 200', (cb) ->
      options =
        method: "GET"
        url: "/users/for-ids?ids=#{fixtures.user1.id}"
        credentials: fixtures.user1
      server.inject options, (response) ->
        result = response.result

        response.statusCode.should.equal 200
        should.exist result
        result.should.have.property "items"
        result.items.should.have.lengthOf 1

        console.log JSON.stringify(response.result)
  
        cb null


