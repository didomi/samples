const { getPurposesTranslations } = require("../src/purposes");

(async () => {
  try {
    await getPurposesTranslations();
  } catch (error) {
    if (error.response?.status === 401) {
      console.error(
        "⚠️  Please enter a valid authentication token.\nMore information here: https://developers.didomi.io/api/introduction/authentication",
      );
    } else {
      console.error(error);
      throw error;
    }
  }
})();
