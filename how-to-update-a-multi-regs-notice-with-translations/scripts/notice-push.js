const { updateNoticeTranslations } = require("../src/notices");

(async () => {
  try {
    const language = process.env.npm_config_language;
    const filename = process.env.npm_config_filename;

    if (!filename) {
      throw new Error(`Please provide a filename for the translations file using the --filename option.`);
    }

    if (!language) {
      throw new Error(`Please provide a language for the translations file using the --language option.`);
    }

    if (language == "en") {
      throw new Error(`"en" is the default language and cannot be updated. Please choose another language.`);
    }

    await updateNoticeTranslations({ filename, language });
  } catch (error) {
    if (error.statusCode === 401) {
      console.error("⚠️  Please enter a valid authentication token.\nMore information here: https://developers.didomi.io/api/introduction/authentication");
    } else {
      console.error(error);
    }
  }
})();
