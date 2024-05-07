const fs = require("fs");
const axios = require("axios");
const config = require("./config");
const { fetchAPIToken, writeJSONFile } = require("./commons");

/**
 * Fetches all purposes from organization
 * @param {string} token - The authorization token.
 * @returns {Promise<Object>} The GDPR notice configuration data.
 */
const fetchAllPurposes = async (token) => {
  try {
    const {
      data: { data },
    } = await axios.get(`${config.baseUrl}/metadata/purposes?$translations=true&organization_id=${config.organizationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data;
  } catch (error) {
    console.error(error);
  }
};

/**
 * Map a purpose to a translatable object
 */
const mapPurposeToTranslations = (purpose) => ({
  description: purpose.description,
  details: purpose.details,
});

/**
 * Map a list of purposes to translatable objects
 */
const mapPurposesToTranslations = (purposes) => {
  return purposes.map((purpose) => ({
    id: purpose.id,
    ...mapPurposeToTranslations(purpose),
  }));
};

/**
 * Fetch all purposes and write them to the input file
 */
const getPurposesTranslations = async () => {
  const token = await fetchAPIToken();
  const purposes = await fetchAllPurposes(token);

  const translations = mapPurposesToTranslations(purposes);
  const content = {
    translations: {
      purposes: translations,
    },
  };
  writeJSONFile("data/purposes_translations_input.json", content);
};

/**
 * Update a list of purposes from their translatable objects
 */
const updatePurposes = async (token, translations) => {
  const purposes = translations?.translations?.purposes || [];

  for (const purpose of purposes) {
    try {
      await axios.patch(
        `${config.baseUrl}/metadata/purposes/${purpose.id}`,
        {
          description: purpose.description,
          details: purpose.details,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(`Purpose ${purpose.id} updated`);
    } catch (error) {
      console.error(`Purpose ${purpose.id} failed to update due to an error:`, error);
      throw error;
    }
  }
};

/**
 * Update all purposes from the output file
 */
const updatePurposesTranslations = async () => {
  const token = await fetchAPIToken();
  const translations = JSON.parse(fs.readFileSync("./data/purposes_translations_output.json", "utf8"));

  // Update the purposes
  await updatePurposes(token, translations);
};

module.exports = {
  getPurposesTranslations,
  updatePurposesTranslations,
};
