const { writeFileSync } = require("fs");
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
    throw error;
  }
};

/**
 * Returns a language-specific value from the given object.
 *
 * This function attempts to retrieve `object[language]`. If the specified language
 * is not found in the object, it falls back to `object.en` if available.
 *
 * The language specific option is used when replacing macros.
 *
 * @param {Object} object - The object containing language-specific values.
 * @param {string} language - The language code to retrieve.
 * @returns {*} The value corresponding to the specified language, or English as fallback.
 */
const getLanguageOrDefault = (object, language) =>
  object?.[language] ?? object?.en;

/**
 * Returns the appropriate key based on position.
 *
 * @param {string} [position] - The position type (e.g., "popup", "notice", etc.). Defaults to "popup" if undefined.
 * @returns {string} Either "popup" or "notice" depending on input; defaults to "popup" if undefined.
 */
const getPositionKey = (position) =>
  position === "popup" || position === undefined ? "popup" : "notice";

const writeJSONFile = (path, data) => {
  try {
    writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
    console.log("✅ Translations input file created successfully!");
  } catch (err) {
    console.error("❌ Failed to write translations file:", err);
    throw err;
  }
};

module.exports = {
  fetchAPIToken,
  getLanguageOrDefault,
  getPositionKey,
  writeJSONFile,
};
