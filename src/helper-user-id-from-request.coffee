_ = require 'underscore'
Hoek = require 'hoek'

###
Returns the user id from a request
###
module.exports = (request) ->
  Hoek.assert _.isObject(request), "The required parameter request is missing or not an object."

  request.auth?.credentials?.id?.toString()
