/**
 * The list of cookies to keep
 */
(function () {
  var itemsToKeep = ["euconsent-v2", "didomi_token"];
  var itemsToKeepRegex = /some_regex_[a-z0-9]*/;

  /**
   * Returns cookie value
   */
  var getCookieValue = function (cookieName) {
    var cookie = document.cookie.split(";").filter(function (cookieValue) {
      return cookieValue.indexOf(cookieName) !== -1;
    })[0];
    if (cookie) {
      return cookie.split("=")[1];
    }
  };

  var deleteCookie = function (name, domain, path) {
    path = path || "/";
    var cookie = [
      name + "=",
      "expires=Thu, 01 Jan 1970 00:00:01 GMT",
      "path=" + path,
    ];
    if (domain) {
      cookie.push("domain=" + domain);
    }
    document.cookie = cookie.join(";");
  };

  /**
   * Check if all vendor and purposes are disabled
   */
  var areAllVendorsAndPurposesDisabled = function () {
    var enabledEntities = [];
    var disabledEntities = [];
    var data = window.Didomi.getUserStatus();

    data.vendors.consent.enabled.forEach(function (entity) {
      enabledEntities.push(entity);
    });

    data.purposes.consent.enabled.forEach(function (entity) {
      enabledEntities.push(entity);
    });

    data.vendors.consent.disabled.forEach(function (entity) {
      disabledEntities.push(entity);
    });

    data.purposes.consent.disabled.forEach(function (entity) {
      disabledEntities.push(entity);
    });

    /**
     * We check that we don't have any enabled entities
     * and that disabled entities are present
     */
    return enabledEntities.length === 0 && disabledEntities.length > 0;
  };

  var consentEventsCount = 0;
  var existingConsentString = getCookieValue("euconsent-v2");
  window.didomiEventListeners = window.didomiEventListeners || [];
  window.didomiEventListeners.push({
    event: "consent.changed",
    listener: function () {
      /**
       * We catch consent update event in 2 cases:
       * -> 1. When user gives consent and updates it without the page reload (via `consentEventsCount` value)
       * -> 2. When user gives consent and updates it after the page reload (via `existingConsentString` value)
       */
      var consentUpdate =
        consentEventsCount > 0 ? true : !!existingConsentString;
      if (consentUpdate && areAllVendorsAndPurposesDisabled()) {
        /**
         * Consent has been given previously and this is a consent update
         */
        var cookiesToDelete = document.cookie
          .split(";")
          .map(function (cookie) {
            return cookie.split("=")[0].trim();
          })
          .filter(function (cookieName) {
            return (
              itemsToKeep.indexOf(cookieName) === -1 &&
              !cookieName.match(itemsToKeepRegex)
            );
          });

        /**
         * Delete cookies
         */
        cookiesToDelete.forEach(function (cookieToDelete) {
          /**
           * Delete from every possible domain (based on the current page domain) :
           */
          var domains = (
            ".#" + document.location.host.replaceAll(".", "#.#")
          ).split("#");

          while (domains.length) {
            var possibleDomain = domains.join("");
            deleteCookie(cookieToDelete, possibleDomain);
            domains.shift();
          }
          deleteCookie(cookieToDelete, "");
        });

        var localStorageItemsToDelete = Object.keys(window.localStorage).filter(
          function (localStorageItemName) {
            return (
              itemsToKeep.indexOf(localStorageItemName) === -1 &&
              !localStorageItemName.match(itemsToKeepRegex)
            );
          }
        );

        /**
         * Delete local storage items
         */
        localStorageItemsToDelete.forEach(function (localStorageItemName) {
          window.localStorage.removeItem(localStorageItemName);
        });

        // Reload the page
        window.location.reload();
      }

      consentEventsCount++;
    },
  });
})();
