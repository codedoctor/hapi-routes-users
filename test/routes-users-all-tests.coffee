assert = require 'assert'
should = require 'should'
mongoose = require 'mongoose'
_ = require 'lodash'

fixtures = require './support/fixtures'
loadServer = require './support/load-server'
setupServer = require './support/setup-server'
setupUsers = require './support/setup-users'

describe 'testing users all', ->
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
              credentials: fixtures.user1
            server.inject options, (response) ->
              result = response.result

              response.statusCode.should.equal 200
              should.exist result
        
              cb null
      describe 'against /users with sort parameters', ->
        beforeEach (cb) ->
          data1 = {}
          data2 = {}
          data3 = {}
          data4 = {}
          data5 = {}
          # Clones the fixtures
          _.extend(data2, fixtures.user2)
          _.extend(data3, fixtures.user3)
          _.extend(data4, fixtures.user4)
          _.extend(data5, fixtures.user5)
          methods = server.plugins['hapi-user-store-multi-tenant'].methods
          fixtures.user2.id = null
          methods.users.create fixtures._tenantId,data2,null, (err,user,token) ->
            return cb err if err
            fixtures.user2.id = user._id
            fixtures.user3.id = null
            methods.users.create fixtures._tenantId,data3,null, (err,user,token) ->
              return cb err if err
              fixtures.user3.id = user._id
              fixtures.user4.id = null
              methods.users.create fixtures._tenantId,data4,null, (err,user,token) ->
                return cb err if err
                fixtures.user4.id = user._id
                methods.users.create fixtures._tenantId,data5,null, (err,user,token) ->
                  return cb err if err
                  fixtures.user4.id = user._id
                  cb null
        afterEach (cb) ->
          # Resets the user collections
          mongoose.connection.collection('identitymt.users').remove {}, (err, user) ->
            data1 = {}
            _.extend(data1, fixtures.user1)
            methods = server.plugins['hapi-user-store-multi-tenant'].methods
            methods.users.create fixtures._tenantId,data1,null, (err,user,token) ->
              fixtures.user1.id = user._id
              return cb err if err
              cb null
        it 'should sort the result according to primaryEmail in DESC order', (cb) ->
          options =
            method: "GET"
            url: "/users?sort=-primaryEmail"
            credentials: fixtures.user1
          server.inject options, (response) ->
            result = response.result
            result.items[0].username.should.equal fixtures.user4.username
            response.statusCode.should.equal 200
            should.exist result
            cb null
        it 'should sort the result according to primaryEmail in ASC order', (cb) ->
          options =
            method: "GET"
            url: "/users?sort=primaryEmail"
            credentials: fixtures.user1
          server.inject options, (response) ->
            result = response.result
            result.items[0].username.should.equal fixtures.user1.username
            response.statusCode.should.equal 200
            should.exist result
            cb null
        it 'should support multiple sort parameters', (cb) ->
          options =
            method: "GET"
            url: "/users?sort=-primaryEmail gender"
            credentials: fixtures.user1
          server.inject options, (response) ->
            result = response.result
            result.items[0].username.should.equal fixtures.user5.username
            result.items[0].gender.should.equal fixtures.user4.gender
            result.items[1].username.should.equal fixtures.user4.username
            result.items[1].gender.should.equal fixtures.user5.gender
            response.statusCode.should.equal 200
            should.exist result
            cb null
        it 'should support multiple sort parameters', (cb) ->
          options =
            method: "GET"
            url: "/users?sort=-primaryEmail -gender"
            credentials: fixtures.user1
          server.inject options, (response) ->
            result = response.result
            result.items[0].username.should.equal fixtures.user5.username
            result.items[0].gender.should.equal fixtures.user5.gender
            result.items[1].username.should.equal fixtures.user4.username
            result.items[1].gender.should.equal fixtures.user4.gender
            response.statusCode.should.equal 200
            should.exist result
            cb null

