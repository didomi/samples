const { fetchAPIToken } = require("./commons");
const {
  getNoticeTranslations,
  parseTranslationsToNoticeConfig,
  updateNoticeConfigTranslations,
} = require("./notices");
const { readFileSync } = require("fs");
const config = require("./config");

const replaceNoticesWithMacros = async ({
  language,
  position,
  childrenNotices,
  dryRun = false,
}) => {
  // Get the translations from the master notice configured in the `config.noticeId`
  await getNoticeTranslations(language, position);

  // Parse the previously fetched translations
  let translations;
  try {
    translations = JSON.parse(readFileSync(config.translationsPath, "utf8"));
  } catch (err) {
    console.error("Failed to read or parse the translation file:", err);
    throw err;
  }

  // Get an access token to push the updated translations
  const token = await fetchAPIToken();

  // Iterate over all children notices set in `macros.json`
  for (const child of childrenNotices) {
    const childTranslations = {};
    const unusedMacros = new Set(child.macros.map((m) => m.key));

    for (const key in translations) {
      let value = translations[key];

      // Iterate over all macros associated with each child notice
      for (const macro of child.macros) {
        const macroKey = macro.key;
        let macroVal;

        // Use the language specific value if it is an object, or use the value directly if not
        if (typeof macro.value === "object") {
          // Abort if the language-specific value is missing
          if (!(language in macro.value)) {
            throw new Error(
              `Missing macro translation for key "${macroKey}" in language "${language}".\nPlease define it in macros.json.`,
            );
          }
          macroVal = macro.value[language];
        } else {
          macroVal = macro.value;
        }

        // Perform macro replacement
        if (typeof value === "string" && value.includes(macroKey)) {
          unusedMacros.delete(macroKey);
          value = value.replaceAll(macroKey, macroVal);
        }
      }

      // Replace the notice ID in the key path to point to the child notice
      const updatedKey = key.replace(
        /notice\.[^.]+/,
        `notice.${child.noticeId}`,
      );
      childTranslations[updatedKey] = value;
    }

    // Report any unused macros for improvements
    if (unusedMacros.size > 0) {
      console.warn(
        `⚠️  Warning: Unused macros for notice "${child.noticeId}": ${[...unusedMacros].join(", ")}`,
      );
    }

    // Rebuild the notice config
    const noticeConfig = parseTranslationsToNoticeConfig(childTranslations);

    // Pass the child notice ID to update its specific notice
    await updateNoticeConfigTranslations(
      token,
      noticeConfig,
      language,
      position,
      child.noticeId,
      dryRun,
    );
  }
};

module.exports = { replaceNoticesWithMacros };
