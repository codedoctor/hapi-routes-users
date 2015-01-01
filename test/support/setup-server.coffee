fixtures = require './fixtures'

module.exports = (server,cb) ->
  data = 
    _tenantId: fixtures._tenantId
    name : 'codedoctor'
    websiteUrl: 'http://somesite.com'
    imageUrl: null
    callbackUrl: null
    notes: 'Some comment'
    scopes: ['read','write']
    revoked: 0
    description: ''
    acceptTermsOfService: true
    isPublished: true
    organizationName: 'codedoctor'
    organizationUrl: 'http://somesite.com'
    tosAcceptanceDate : null
    clientId: fixtures.clientId

    redirectUrls: []
    stat: 
      tokensGranted : 0
      tokensRevoked : 0

  methods = server.plugins['hapi-oauth-store-multi-tenant'].methods
  methods.oauthApps.create fixtures._tenantId,data,null, (err,app) ->
    return cb err if err
    cb null
