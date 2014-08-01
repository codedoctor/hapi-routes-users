_ = require 'underscore'
Boom = require 'boom'

helperObjToRest = require './helper-obj-to-rest'

module.exports = (oauthAuth, baseUrl,accountId,userId, clientId, realm, scope ,user, cb) ->

  if clientId
    oauthAuth.createOrReuseTokenForUserId accountId,userId, clientId, realm,scope, null, (err, token) =>
      return cb err if err
      return cb new Boom.badRequest("#{baseUrl}/users") unless token

      user = helperObjToRest.user user, "#{baseUrl}/users"
      _.extend user,
        token:
          accessToken : token.accessToken
          refreshToken : token.refreshToken

      cb null, user
  else
    cb null, helperObjToRest.user user, "#{baseUrl}/users"
