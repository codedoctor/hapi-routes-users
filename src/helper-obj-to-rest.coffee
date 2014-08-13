_ = require 'underscore'
Hoek = require 'hoek'
i18n = require './i18n'

module.exports =

  identity: (identity,baseUrl) ->
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

  user: (user,baseUrl) ->
    Hoek.assert baseUrl,i18n.assertBaseUrlRequired

    return null unless user

    localUrl = "#{baseUrl}/#{user._id}"
    res =
      _url: localUrl
      id: user._id
      username: user.username
      displayName: user.displayName
      description: user.description

      identities: _.map user.identities || [], (x) -> module.exports.identity x, "#{localUrl}/identities"

      profileLinks: user.profileLinks || []
      userImages: user.userImages || []
      selectedUserImage: user.selectedUserImage
      emails: user.emails || []
      roles: user.roles || []
      data: user.data || {}

      stats: user.stats || {}
      resourceLimits: user.resourceLimits || {}

      createdAt: user.createdAt
      updatedAt: user.updatedAt
      isDeleted: user.isDeleted || false
      deletedAt: user.deletedAt || null
      onboardingState: user.onboardingState
      primaryEmail: user.primaryEmail
      resetPasswordToken: user.resetPasswordToken
      title: user.title
      location: user.location
      needsInit: user.needsInit

      gender: user.gender
      timezone: user.timezone
      locale: user.locale
      verified: user.verified
    res


  oauthApp: (oauthApp,baseUrl) ->
    Hoek.assert baseUrl,i18n.assertBaseUrlRequired

    return null unless oauthApp

    notRevokedClients =  _.filter( oauthApp.clients || [], (x) -> !x.revokedAt)
    localUrl = "#{baseUrl}/#{oauthApp._id}"
    
    res =
      _url : localUrl
      id : oauthApp._id
      name : oauthApp.name
      description : oauthApp.description
      websiteUrl: oauthApp.websiteUrl
      imageUrl: oauthApp.imageUrl
      callbackUrl: oauthApp.callbackUrl
      notes: oauthApp.notes
      scopes: oauthApp.scopes
      revoked: oauthApp.revoked
      acceptTermsOfService: oauthApp.acceptTermsOfService
      isPublished: oauthApp.isPublished
      organizationName: oauthApp.organizationName
      organizationUrl: oauthApp.organizationUrl
      tosAcceptanceDate: oauthApp.tosAcceptanceDate
      clients: _.map notRevokedClients , (x) -> module.exports.oauthClient x, "#{localUrl}/clients"
      redirectUrls: oauthApp.redirectUrls
      stats: oauthApp.stats
      tags : oauthApp.tags
      createdAt: oauthApp.createdAt
      updatedAt: oauthApp.updatedAt
      createdByUserId: oauthApp.createdByUserId
      accessibleBy: oauthApp.accessibleBy
      isDeleted : oauthApp.isDeleted || false
      deletedAt : oauthApp.deletedAt || null
    res

  organization: (organization,baseUrl) ->
    Hoek.assert baseUrl,i18n.assertBaseUrlRequired

    return null unless organization
    res = 
      _url : "#{baseUrl}/#{organization._id}"
      id : organization._id
      name : organization.name
      description : organization.description
      stats : organization.stats || {}
      resourceLimits : organization.resourceLimits || {}
      profileLinks : organization.profileLinks || []
      data : organization.data || {}
      tags : organization.tags
      createdAt: organization.createdAt
      updatedAt: organization.updatedAt
      createdByUserId : organization.createdByUserId
      accessibleBy: organization.accessibleBy
      isDeleted : organization.isDeleted || false
      deletedAt : organization.deletedAt || null
    res

  oauthClient:  (oauthClient,baseUrl) ->
    Hoek.assert baseUrl,i18n.assertBaseUrlRequired

    return null unless oauthClient
    res = 
      _url : "#{baseUrl}/#{oauthClient._id}"
      id : oauthClient._id
      clientId : oauthClient.clientId
      secret : oauthClient.secret
      createdAt : oauthClient.createdAt
      revokedAt : oauthClient.revokedAt
    res

  scope: (scope,baseUrl) ->
    Hoek.assert baseUrl,i18n.assertBaseUrlRequired
 
    return null unless scope
    res =
      slug : scope.name
      name : scope.name
      description : scope.description || ''
      developerDescription : scope.developerDescription || ''
      roles : scope.roles || []

    res.url = "#{baseUrl}/#{scope.name}"
    res


