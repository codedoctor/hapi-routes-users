_ = require 'underscore'
Boom = require 'boom'
Hoek = require 'hoek'
i18n = require './i18n'
helperObjToRest = require './helper-obj-to-rest'

module.exports = (oauthAuthMethods, baseUrl,_tenantId,userId, clientId, realm, scope ,user, cb) ->
  if clientId
    ###
    @TODO: Check input values here
    ###

    oauthAuthMethods.createOrReuseTokenForUserId _tenantId,userId, clientId, realm,scope, null, (err, token) =>
      return cb err if err
      return cb new Boom.badRequest(i18n.errorTokenRequired) unless token

      user = helperObjToRest.user user, "#{baseUrl}/users"
      _.extend user,
        token:
          accessToken : token.accessToken
          refreshToken : token.refreshToken

      cb null, user
  else
    cb null, helperObjToRest.user user, "#{baseUrl}/users"
