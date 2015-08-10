(function() {
  var Hoek, _, helperObjToRestIdentity, i18n;

  _ = require('underscore');

  Hoek = require('hoek');

  i18n = require('./i18n');

  helperObjToRestIdentity = require('./helper-obj-to-rest-identity');

  module.exports = function(user, baseUrl) {
    var localUrl, res;
    Hoek.assert(baseUrl, i18n.assertBaseUrlRequired);
    if (!user) {
      return null;
    }
    localUrl = baseUrl + "/" + user._id;
    res = {
      _url: localUrl,
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      description: user.description,
      identities: _.map(user.identities || [], function(x) {
        return helperObjToRestIdentity(x, localUrl + "/identities");
      }),
      profileLinks: user.profileLinks || [],
      userImages: user.userImages || [],
      selectedUserImage: user.selectedUserImage,
      emails: user.emails || [],
      roles: user.roles || [],
      data: user.data || {},
      stats: user.stats || {},
      resourceLimits: user.resourceLimits || {},
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isDeleted: user.isDeleted || false,
      deletedAt: user.deletedAt || null,
      onboardingState: user.onboardingState,
      primaryEmail: user.primaryEmail,
      resetPasswordToken: user.resetPasswordToken,
      title: user.title,
      location: user.location,
      needsInit: user.needsInit,
      gender: user.gender,
      timezone: user.timezone,
      locale: user.locale,
      verified: user.verified
    };
    return res;
  };

}).call(this);

//# sourceMappingURL=helper-obj-to-rest-user.js.map
