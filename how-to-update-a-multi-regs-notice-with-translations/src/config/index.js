const secrets = require("./secrets");

const config = {
  /**
   * Base URL of the Didomi API
   */
  baseUrl: "https://api.didomi.io/v1",

  /**
   * API Authentication Secrets.
   * See: secrets.js
   */
  secrets,

  /**
   * The identifier for the notice you want to update
   */
  noticeId: "<NOTICE_ID>", // Replace with the actual Notice ID

  /**
   * The identifier of your organization within Didomi
   */
  organizationId: "<ORGANIZATION_ID>", // Replace with the actual Organization ID
};

module.exports = config;
