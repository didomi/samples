const fs = require("fs");
const axios = require("axios");
const config = require("./config");

/**
 * Asynchronously fetches an API token from a server.
 *
 * @returns {Promise<string>} A promise that resolves to the API token as a string.
 */
const fetchAPIToken = async () => {
  try {
    const response = await axios.post(`${config.baseUrl}/sessions`, {
      type: "api-key",
      key: config.secrets.id,
      secret: config.secrets.secret,
    });

    return response.data.access_token;
  } catch (error) {
    console.error(error);
  }
};

/**
 * Return a translatable text with only the default (EN) language.
 */
const keepOnlyDefaultLanguage = (object) => ({ en: object?.en });

/**
 * Helper to write an object to a JSON file.
 */
const writeJSONFile = (path, data) =>
  fs.writeFile(path, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log("Translations input file created successfully!");
    }
  });

module.exports = {
  fetchAPIToken,
  keepOnlyDefaultLanguage,
  writeJSONFile,
};
