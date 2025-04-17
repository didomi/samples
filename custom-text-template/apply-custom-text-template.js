const axios = require("axios");
const readline = require("readline");
const SCRIPT_INPUT = require("./config.json");

/**
 * Checks if a regulation configuration is the default, enabled, and has geo-locations defined.
 * @param {object} regulationConfig - The regulation configuration object.
 * @returns {boolean} True if the regulation config is enabled and default, false otherwise.
 */
function isEnabledDefaultRegulationConfig(regulationConfig) {
  return (
    regulationConfig.is_default_regulation_config &&
    !regulationConfig.disabled_at &&
    regulationConfig.geo_locations.length
  );
}

/**
 * Finds a notice by its ID using the API
 * @param {string} noticeId - The ID of the notice to find.
 * @returns {Promise<object>} A promise that resolves with the notice object.
 * @throws {Error} If the notice is not found.
 */
async function findNotice(noticeId) {
  const { data } = await axios.get(
    `${SCRIPT_INPUT.baseUrl}/widgets/notices/${noticeId}`,
    { headers: { Authorization: SCRIPT_INPUT.token } }
  );

  if (!data.id) {
    throw new Error(`❌ Notice not found for id: ${noticeId}`);
  }

  return data;
}

/**
 * Extracts the notice text content based on the notice platform and position.
 * @param {object} noticeConfig - The notice configuration object.
 * @param {object} regulationConfig - The regulation configuration object.
 * @returns {object|undefined} The text content object for the notice, or undefined if not found.
 */
function extractText(noticeConfig, regulationConfig) {
  const contentKey = getNoticeContentKey(
    regulationConfig.config,
    noticeConfig.platform
  );

  return regulationConfig.config.notice?.content[contentKey];
}

/**
 * Formats a regulation configuration for display in a selection list.
 * @param {object} noticeConfig - The notice configuration object.
 * @param {object} regulationConfig - The regulation configuration object.
 * @param {number} index - The index of the regulation configuration in the list.
 * @returns {string} A formatted string representing the regulation configuration.
 */
function toRegulationSelectionText(noticeConfig, regulationConfig, index) {
  const text = extractText(noticeConfig, regulationConfig);
  const locales = Object.keys(text).filter((key) => Boolean(text[key]));
  const indexText = `${index + 1}. ${regulationConfig.regulation_id} [${regulationConfig.id}]:`;
  return `${indexText} ${locales.length} non empty locale/s: [${locales.join(", ")}]`;
}

/**
 * Fetches notice config.
 * @param {string} noticeId - The notice ID.
 * @returns {Promise<Object>} The GDPR notice configuration data.
 */
async function fetchNoticeConfig(noticeId) {
  let noticeConfig;

  const {
    data: { data },
  } = await axios.get(
    `${SCRIPT_INPUT.baseUrl}/widgets/notices/configs?notice_id=${noticeId}&deployed_at=null`,
    {
      headers: {
        Authorization: SCRIPT_INPUT.token,
        v: 2,
      },
    }
  );

  noticeConfig = data[0];

  if (!noticeConfig) {
    console.error("❌ No configuration found for noticeId:", noticeId);
    throw new Error(`Notice config not found for notice ID: ${noticeId}`);
  }

  return noticeConfig;
}

/**
 * Updates a notice configuration using the API, or logs the action in dry run mode.
 * @param {object} noticeConfig - The notice configuration object to update.
 * @returns {Promise<void>} A promise that resolves when the update is complete or logged.
 */
async function updateNoticeConfig(noticeConfig) {
  const isDryRun = SCRIPT_INPUT.dryRun;

  if (!isDryRun) {
    await axios.patch(
      `${SCRIPT_INPUT.baseUrl}/widgets/notices/configs/${noticeConfig.id}`,
      noticeConfig,
      {
        headers: {
          Authorization: SCRIPT_INPUT.token,
          v: 2,
        },
      }
    );
  }

  console.log(
    `✅${isDryRun ? " [DRY RUN]" : ""} Updated notice config for id: ${
      noticeConfig.id
    }`
  );
}

/**
 * Determines the position of the notice ('popup' or 'top') based on the configuration.
 * @param {object} config - The configuration object (usually regulationConfig.config).
 * @returns {string} The notice position ('popup' or 'top'). Defaults to 'top'.
 */
function getNoticePosition(config) {
  return config?.notice?.position || "top";
}

/**
 * Determines the key ('popup' or 'notice') for accessing the content based on platform and position.
 * @param {object} config - The configuration object (usually regulationConfig.config).
 * @param {string} platform - The notice platform ('web', 'amp', etc.).
 * @returns {string} The content key ('popup' or 'notice').
 */
function getNoticeContentKey(config, platform) {
  return (platform === "web" || platform === "amp") &&
    getNoticePosition(config) === "popup"
    ? "popup"
    : "notice";
}

/**
 * Sets the text content within a specific regulation configuration's notice content.
 * @param {object} noticeConfig - The main notice configuration object.
 * @param {object} regulationConfig - The specific regulation configuration to modify.
 * @param {object} text - The text object containing locale-keyed strings.
 * @returns {object} The modified regulation configuration object.
 */
function setTextInNoticeRegulationConfig(noticeConfig, regulationConfig, text) {
  const contentKey = getNoticeContentKey(
    regulationConfig.config,
    noticeConfig.platform
  );

  regulationConfig.config = {
    ...regulationConfig.config,
    notice: {
      ...(regulationConfig.config.notice || {}),
      content: {
        ...(regulationConfig.config.notice?.content || {}),
        [contentKey]: text,
      },
    },
  };

  return regulationConfig;
}

/**
 * Prompts the user with a question in the console and returns their answer.
 * @param {string} query - The question to ask the user.
 * @returns {Promise<string>} A promise that resolves with the user's input string.
 */
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    })
  );
}

/**
 * Selects the master regulation configuration to use as the template.
 * Fetches the master notice and its config, identifies potential master regulation configs,
 * prompts the user for selection if multiple are found, and validates the selection.
 * @returns {Promise<{masterRegConfig: object, masterNoticeConfig: object, masterText: object, masterLocales: string[]}>}
 *   A promise resolving to an object containing the selected master regulation configuration,
 *   the master notice config, the extracted master text, and the available master locales.
 * @throws {Error} If no suitable master regulation configuration is found or if the selected one has no text.
 */
async function selectMasterRegulationConfig() {
  const notice = await findNotice(SCRIPT_INPUT.masterNoticeId);

  console.log(`✅ Master notice found: ${notice.id}, ${notice.name}`);

  const masterNoticeConfig = await fetchNoticeConfig(
    SCRIPT_INPUT.masterNoticeId
  );

  console.log(`✅ Master draft notice config found: ${masterNoticeConfig.id}`);

  const masterRegulations = masterNoticeConfig.regulation_configurations.filter(
    isEnabledDefaultRegulationConfig
  );

  let masterRegConfig;

  if (masterRegulations.length === 1) {
    masterRegConfig = masterRegulations[0];
  } else if (masterRegulations.length > 1) {
    console.log(
      `❗ Found multiple regulation configurations in the master notice config, please select one: \n${masterRegulations
        .map((reg, i) => toRegulationSelectionText(masterNoticeConfig, reg, i))
        .join("\n")}`
    );

    while (!masterRegConfig) {
      const masterRegulationId = await askQuestion(
        "Enter the number of the master regulation configuration you want to select: "
      );
      masterRegConfig = masterRegulations[masterRegulationId - 1];
    }
  }

  if (!masterRegConfig) {
    console.error("❌ No master regulation configurations found");
    throw new Error("No master regulation configurations found");
  }

  const masterText = extractText(masterNoticeConfig, masterRegConfig);

  if (!masterText) {
    throw new Error("❌ The Master NoticeRegulationConfig has not text!!!");
  }

  const masterLocales = Object.keys(masterText).filter((key) =>
    Boolean(masterText[key])
  );

  console.log(
    `✅ Selected ${masterRegConfig.regulation_id} as master NoticeRegulationConfig with locales: [${masterLocales.join(", ")}] to get template text`
  );

  return { masterRegConfig, masterNoticeConfig, masterText, masterLocales };
}

/**
 * Validates the script input configuration (SCRIPT_INPUT).
 * Checks for dry run mode and the presence of an API token.
 * @throws {Error} If the API token is missing.
 */
function validateConfig() {
  if (SCRIPT_INPUT.dryRun) {
    console.log("🔑 Dry run mode enabled, skipping actual updates");
  }

  if (!SCRIPT_INPUT.token) {
    throw new Error("API token is missing");
  }

  if (SCRIPT_INPUT.childrenNotices.length === 0) {
    console.log("🔑 No children notices to process");
    return;
  }
}

/**
 * Fetches the notice configurations for all children notices defined in SCRIPT_INPUT.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of enriched
 *   children notice objects, each including its fetched `noticeConfig`.
 */
async function findChildrenNoticeConfigs() {
  return await Promise.all(
    SCRIPT_INPUT.childrenNotices.map(async (childNotice) => {
      const nc = await fetchNoticeConfig(childNotice.noticeId);
      return {
        ...childNotice,
        noticeConfig: nc,
      };
    })
  );
}

/**
 * Creates a callback function that, when executed, will update a specific child notice configuration.
 * It processes the regulations and macros for the child notice based on the master template.
 * @param {object} noticeConfig - The child notice configuration object.
 * @param {string[]} regulationIds - The specific regulation IDs to process for this child notice.
 * @param {Array<{key: string, value: object}>} macros - The macros to apply for this child notice.
 * @param {string[]} masterLocales - An array of locales available in the master text.
 * @param {object} masterText - The master text object (locale-keyed strings).
 * @returns {Promise<Function>} A promise that resolves with a function that performs the updateNoticeConfig call.
 */
async function getCallbackToUpdateNoticeConfig(
  noticeConfig,
  regulationIds,
  macros,
  masterLocales,
  masterText
) {
  const notice = await findNotice(noticeConfig.notice_id);

  console.log(
    `\n🔄 Processing notice ${notice.name}, notice config id: ${noticeConfig.id} with enabled regulations: [${noticeConfig.regulation_configurations
      .filter(isEnabledDefaultRegulationConfig)
      .map((nrc) => nrc.regulation_id)
      .join(", ")}]`
  );

  let hasChanges = false;

  for (const regulationId of regulationIds) {
    hasChanges =
      hasChanges ||
      processRegulationInChildNoticeConfig(
        noticeConfig,
        regulationId,
        macros,
        masterLocales,
        masterText
      );
  }

  if (!hasChanges) {
    console.log(
      `✅ No changes to apply for notice config for id: ${noticeConfig.id}`
    );
    return undefined;
  }

  return () => updateNoticeConfig(noticeConfig);
}

/**
 * Processes a specific regulation within a child notice configuration.
 * It finds the corresponding regulation config, applies macros to the master text,
 * and sets the resulting text in the child regulation config.
 * @param {object} noticeConfig - The child notice configuration object.
 * @param {string} regulationId - The regulation ID to process.
 * @param {Array<{key: string, value: object}>} macros - The macros to apply.
 * @param {string[]} masterLocales - An array of locales available in the master text.
 * @param {object} masterText - The master text object (locale-keyed strings).
 * @throws {Error} If the master text does not contain a locale specified in the macros.
 * @throws {Error} If a macro key is not found in the master text for a specific locale.
 */
function processRegulationInChildNoticeConfig(
  noticeConfig,
  regulationId,
  macros,
  masterLocales,
  masterText
) {
  const childRegulationConfig = noticeConfig.regulation_configurations.find(
    (nrc) =>
      nrc.is_default_regulation_config && nrc.regulation_id === regulationId
  );

  if (!childRegulationConfig) {
    console.error(
      "❌ Child regulation config not found for notice id:",
      noticeConfig.notice_id,
      "and regulation id:",
      regulationId
    );
  }

  const existingChildText = extractText(noticeConfig, childRegulationConfig);

  const childRegulationConfigText = {};

  let hasChanges = false;

  for (const { key, value: translatableValue } of macros) {
    console.log(
      `🔄 Processing macro: ${key}, with locales: ${Object.entries(
        translatableValue
      )
        .map(([locale, value]) => `${locale}: ${value}`)
        .join(", ")}`
    );

    for (const [macroLocale, macroLocaleValue] of Object.entries(
      translatableValue
    )) {
      if (!masterLocales.includes(macroLocale) || !masterText[macroLocale]) {
        throw new Error(
          `❌ The master text does not contain the locale "${macroLocale}" configured in the macros of the child regulation config: ${regulationId} and noticeId: ${noticeConfig.notice_id}`
        );
      }

      const masterLocaleText = masterText[macroLocale];

      if (!masterLocaleText.includes(key)) {
        throw new Error(
          `❌ Defined macro key ${key} was not found in the master text for locale: ${macroLocale}`
        );
      }

      const replacedText = masterLocaleText.replace(key, macroLocaleValue);

      const existingIsEqual = existingChildText?.[macroLocale] === replacedText;

      childRegulationConfigText[macroLocale] = replacedText;

      if (existingIsEqual) {
        console.log(`🔄 No changes for locale ${macroLocale}`);
      } else {
        hasChanges = true;
        console.log(`🔄 There are changes to apply for locale ${macroLocale}`);
      }
    }
  }

  setTextInNoticeRegulationConfig(
    noticeConfig,
    childRegulationConfig,
    childRegulationConfigText
  );

  return hasChanges;
}

/**
 * Main execution function (Immediately Invoked Function Expression - IIFE).
 * Orchestrates the entire process:
 * 1. Validates the input configuration.
 * 2. Selects the master regulation configuration and text.
 * 3. Fetches configurations for all child notices.
 * 4. Generates update callbacks for each child notice after processing macros.
 * 5. Prompts the user for confirmation.
 * 6. Executes the update callbacks if confirmed.
 */
(async function () {
  console.log("🚀 Starting template processing");

  validateConfig();

  const { masterLocales, masterText } = await selectMasterRegulationConfig();

  const childrenNoticeConfigs = await findChildrenNoticeConfigs();

  console.log(
    `✅ Found all ${childrenNoticeConfigs.length} children notices configs`
  );

  const updates = [];

  for (const childNoticeConfig of childrenNoticeConfigs) {
    const callback = await getCallbackToUpdateNoticeConfig(
      childNoticeConfig.noticeConfig,
      childNoticeConfig.regulationIds,
      childNoticeConfig.macros,
      masterLocales,
      masterText
    );

    if (callback) {
      updates.push(callback);
    }
  }

  console.log(); // new line

  if (updates.length === 0) {
    console.log("✅ Done! No updates to apply");
    return;
  }

  let confirmation;
  while (confirmation !== "y" && confirmation !== "n") {
    confirmation = await askQuestion(
      `🔄 ${updates.length} notice configs will be updated, continue? (y/n): `
    );
  }

  if (confirmation !== "y") {
    console.log("🔄 Aborting");
    return;
  }

  console.log("\n🔄 Updating notice configs...");

  for (const update of updates) {
    await update();
  }

  console.log("\n✅ Done!");
})();
