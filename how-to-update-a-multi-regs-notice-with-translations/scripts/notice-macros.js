const { childrenNotices } = require("../src/config/macros.json");
const { fetchAPIToken } = require("../src/commons");
const { fetchGDPRNoticeConfig } = require("../src/notices");
const { replaceNoticesWithMacros } = require("../src/macros");

/**
 * Fetches the list of enabled languages from the GDPR notice configuration.
 *
 * @async
 * @returns {Promise<string[]>} An array of enabled language codes.
 * @throws {Error} If no enabled languages are found in the configuration.
 */
const getEnabledLanguages = async () => {
  const token = await fetchAPIToken();
  const noticeConfig = await fetchGDPRNoticeConfig(token);

  const enabledLanguages = noticeConfig?.config?.languages?.enabled;
  if (!Array.isArray(enabledLanguages) || enabledLanguages.length === 0) {
    throw new Error("No enabled languages found in notice configuration.");
  }

  return enabledLanguages;
};

/**
 * Replaces macros in GDPR notices for a given language.
 *
 * @async
 * @param {string} language - The language code to process.
 * @param {boolean} dryRun - Whether to simulate the process without applying changes.
 * @returns {Promise<void>}
 */
const runMacrosReplacement = async (language, dryRun) => {
  console.log(`✅ Running macros replacement for language: ${language}\n`);

  await replaceNoticesWithMacros({
    language,
    childrenNotices,
    dryRun,
  });
};

/**
 * Determines which languages to process and initiates the macros replacement.
 *
 * Uses command-line arguments:
 *   --language=fr            A single language
 *   --language=fr,en         Multiple comma-separated languages
 *   --language=all           To process all enabled languages
 *   --dry-run=true           To simulate the process without making changes
 *
 * @async
 * @returns {Promise<void>}
 */
(async () => {
  try {
    const dryRun = process.env.npm_config_dry_run === "true";
    const language = process.env.npm_config_language;

    if (!language) {
      throw new Error(
        `Please provide a language using one of the following formats:\n` +
          `  --language=fr           A single language\n` +
          `  --language=fr,en        Multiple comma-separated languages\n` +
          `  --language=all          To process all enabled languages.`,
      );
    }

    let enabledLanguages = [];

    if (language.toLowerCase() === "all") {
      enabledLanguages = await getEnabledLanguages();
    } else {
      enabledLanguages = language.split(",").map((lang) => lang.trim());
    }

    for (const lang of enabledLanguages) {
      await runMacrosReplacement(lang, dryRun);
    }

    console.log(
      `✅ Macros replacement complete for: ${enabledLanguages.join(", ")}`,
    );
  } catch (error) {
    if (error.response?.status === 401) {
      console.error(
        "⚠️  Please enter a valid authentication token.\nMore information here: https://developers.didomi.io/api/introduction/authentication",
      );
    } else {
      console.error("❌ Error:", error.message || error);
    }
    process.exit(1);
  }
})();
