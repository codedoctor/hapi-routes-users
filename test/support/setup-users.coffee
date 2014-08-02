fixtures = require './fixtures'

module.exports = (server,cb) ->
  data =
    username: fixtures.user1.username
    password: fixtures.user1.password
    email: fixtures.user1.email
    name: fixtures.user1.name

  methods = server.pack.plugins['hapi-identity-store'].methods
  methods.users.create fixtures.accountId,data,null, (err,user,token) ->
    return cb err if err
    cb null,user,token
