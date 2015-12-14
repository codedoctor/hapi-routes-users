_ = require 'underscore'
Boom = require 'boom'
Hoek = require 'hoek'
helperUserIdFromRequest = require './helper-user-id-from-request'

###
Checks if the request is authenticated and has a user. The callback returns the userId.
You must "reply" any errors passed in the callback.
###
module.exports = (request,cb)->
  Hoek.assert _.isObject(request),"The required parameter 'request' is missing or not an object."
  Hoek.assert _.isFunction(cb),"The required parameter 'cb' is missing or not an object."

  userId = helperUserIdFromRequest(request)
  return cb Boom.unauthorized("You must be authenticated to access this endpoint.") unless userId

  process.nextTick ->
    cb null, userId


