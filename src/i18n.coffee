

module.exports = 
  ###
  Do not translate, and keep lowercase
  ###
  emailKindPasswordReset : 'passwordreset'
  ###
  Do not translate, and keep lowercase
  ###
  emailKindPasswordResetSuccess : 'passwordresetsuccess'
  ###
  Do not translate, and keep lowercase
  ###
  emailKindPasswordChanged : 'passwordchanged'

  ###
  Do not translate, and keep lowercase
  ###
  emailKindNewUser: 'newuser'

  optionsRouteTagsPublicRequiredAndArray: "options parameter requires a 'routeTagsPublic' field that is an array."

  assertDbMethodsRequired: "The required parameter 'dbMethods' is missing."
  assertDbMethodsAllRequired: "The parameter 'dbMethods' missed an 'all' method."
  assertPluginRequired: "The required parameter 'plugin' is missing."
  assertEndpointRequired: "The required parameter 'endpoint' is missing."
  assertTenantIdRequired: "The required parameter '_tenantId' is missing."
  assertBaseUrlRequired: "The required parameter 'baseUrl' is missing."

  assertClientIdInOptionsRequired: "The required property 'clientId' in 'options' is missing."
  assertTenantIdInOptionsRequired: "The required property '_tenantId' in 'options' is missing."
  assertBaseUrlInOptionsRequired: "The required property 'baseUrl' in 'options' is missing."
  assertRealmInOptionsRequired: "The required property 'realm' in 'options' is missing."

  assertSendEmailInOptionsRequired: "The options parameter requires a sendEmail (kind,email,payload,cb) -> function"
  assertSendEmailInOptionsIsFunction: "The options parameter requires sendEmail to be a function"

  assertMethodsUsersNotFound : "Could not find 'methods.users' in 'hapi-users-store-multi-tenant' plugin."
  assertMethodsOauthAuthNotFound: "Could not find 'methods.oauthAuth' in 'hapi-oauth-store-multi-tenant' plugin."

  errorFailedToSendEmail: "Failed to send email."
  errorUnableToRetrievePassword: "Unable to retrieve password."
  errorUnauthorized: "Authentication required for this endpoint."

  errorTokenRequired: "The required parameter 'token' is missing."