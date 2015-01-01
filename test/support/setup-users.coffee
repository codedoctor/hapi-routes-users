fixtures = require './fixtures'
mongoose = require 'mongoose'

module.exports = (server,cb) ->
  data =
    username: fixtures.user1.username
    password: fixtures.user1.password
    email: fixtures.user1.email
    name: fixtures.user1.name

  methods = server.plugins['hapi-user-store-multi-tenant'].methods

  fixtures.user1.id = null
  methods.users.create fixtures._tenantId,data,null, (err,user,token) ->
    return cb err if err
    fixtures.user1.id = user._id
    cb null,user,token
