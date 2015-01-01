_ = require 'underscore'
databaseCleaner = require './database-cleaner'
Hapi = require "hapi"
hapiUserStoreMultiTenant = require 'hapi-user-store-multi-tenant'
hapiOauthStoreMultiTenant = require 'hapi-oauth-store-multi-tenant'

index = require '../../lib/index'
mongoose = require 'mongoose'

fixtures = require './fixtures'

testMongoDbUrl = 'mongodb://localhost/codedoctor-test'
testPort = 5675
testHost = "localhost"
loggingEnabled = false

module.exports = loadServer = (cb) ->
  server = new Hapi.Server()
  server.connection 
            port: testPort
            host: testHost

  pluginConf = [
      register: hapiUserStoreMultiTenant
    ,
      register: hapiOauthStoreMultiTenant
    ,
      register: index
      options:
        clientId:  fixtures.clientId
        _tenantId: fixtures._tenantId
        baseUrl: "http://localhost:#{testPort}"
        realm: 'codedoctor'
        scope: null
        sendEmail: (kind,email,payload,cb) -> cb null
  ]

  mongoose.disconnect()
  mongoose.connect testMongoDbUrl, (err) ->
    return cb err if err
    databaseCleaner loggingEnabled, (err) ->
      return cb err if err

      server.register pluginConf, (err) ->
        cb err,server