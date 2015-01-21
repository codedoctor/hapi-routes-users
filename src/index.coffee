Hoek = require 'hoek'

i18n = require './i18n'

routesToExport = [
  require './routes'
  require './routes-users-usernameoridorme-patch'
]
###
options:
  clientId: 'some mongodb guid'
  _tenantId: 'some mongodb guid'
  baseUrl: This is the url to your api. For example https://api.mystuff.com
``realm: ignore for now
  scope: leave to null
  resetPasswordClientBaseUrl: MUST BE SET, something like http://fanignite.com/users/reset-password/reset
###
module.exports.register = (server, options = {}, cb) ->

  defaults =
    realm: "default"
  options = Hoek.applyToDefaults defaults, options

  r server,options for r in routesToExport

  server.expose 'i18n',i18n

  cb()

module.exports.register.attributes =
  pkg: require '../package.json'

