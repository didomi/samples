const { childrenNotices } = require("../src/config/macros.json");
const { fetchAPIToken } = require("../src/commons");
const { fetchGDPRNoticeConfig } = require("../src/notices");
const { replaceNoticesWithMacros } = require("../src/macros");

/**
 * Fetches the list of enabled languages and the notice position
 * from the GDPR notice configuration.
 *
 * @async
 * @returns {Promise<{ languages: string[], position: string }>}
 * An object containing an array of enabled language codes and the notice position.
 * @throws {Error} If no enabled languages are found in the configuration.
 */
const getNoticeConfigDetails = async () => {
  const token = await fetchAPIToken();
  const noticeConfig = await fetchGDPRNoticeConfig(token);

  const enabledLanguages = noticeConfig?.config?.languages?.enabled;

  if (!Array.isArray(enabledLanguages) || enabledLanguages.length === 0) {
    throw new Error("No enabled languages found in notice configuration.");
  }

  // Find the default GDPR regulation configuration
  const defaultGDPRConfig = noticeConfig.regulation_configurations.find(
    (config) =>
      config.regulation_id === "gdpr" && config.is_default_regulation_config,
  );

  if (!defaultGDPRConfig) {
    throw new Error("Default GDPR regulation configuration not found.");
  }

  const noticePosition = defaultGDPRConfig?.config?.notice?.position;

  return {
    languages: enabledLanguages,
    position: noticePosition,
  };
};

/**
 * Replaces macros in GDPR notices for a given language and position.
 *
 * @async
 * @param {string} language - The language code to process.
 * @param {string} position - The GDPR notice position.
 * @param {boolean} dryRun - Whether to simulate the process without applying changes.
 * @returns {Promise<void>}
 */
const runMacrosReplacement = async (language, position, dryRun) => {
  console.log(`✅ Running macros replacement for language: ${language}\n`);

  await replaceNoticesWithMacros({
    language,
    position,
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

    const { languages, position } = await getNoticeConfigDetails();

    const enabledLanguages =
      language.toLowerCase() === "all"
        ? languages
        : language.split(",").map((lang) => lang.trim());

    for (const lang of enabledLanguages) {
      await runMacrosReplacement(lang, position, dryRun);
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
