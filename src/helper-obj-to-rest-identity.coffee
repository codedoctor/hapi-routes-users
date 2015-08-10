_ = require 'underscore'
Hoek = require 'hoek'
i18n = require './i18n'

module.exports = (identity,baseUrl) ->
    Hoek.assert baseUrl,i18n.assertBaseUrlRequired

    return null unless identity
    res =
      _url : "#{baseUrl}/#{identity._id}"
      id : identity._id
      provider : identity.provider
      key : identity.key
      v1 : identity.v1
      v2 : identity.v2
      providerType : identity.providerType
      username : identity.username
      displayName : identity.displayName
      profileImage : identity.profileImage
    res
