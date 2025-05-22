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
  noticeId: "<noticeId>", // Replace with the actual Notice ID

  /**
   * The identifier of your organization within Didomi
   */
  organizationId: "<organizationId>", // Replace with the actual Organization ID

  /**
   * The path where the retrieved translations are stored
   */
  translationsPath: "./data/notice_translations_input.json",
};

module.exports = config;
