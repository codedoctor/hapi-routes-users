assert = require 'assert'
should = require 'should'
index = require '../lib/index'
_ = require 'underscore'

loadServer = require './support/load-server'

describe 'index has been loaded', ->
  it 'it should expose a HAPI interface', (cb) ->

    should.exist index
    index.should.have.property "register"
    index.register.should.have.property "attributes"

    cb null

  it 'it should load the plugin', (cb) ->
    loadServer (err,server) ->
      return cb err if err

      should.exist server
      should.exist server.plugins['hapi-routes-users']

      cb null
