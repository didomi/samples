# Notice Master Template Applicator Script

This script applies text content from a "master" notice configuration to multiple "child" notice configurations using the Didomi API. It allows for dynamic text replacements using macros defined per child notice.

## What it Does

- Fetches a draft notice configuration designated as the master template.
- Extracts text content (for specific locales) from a selected regulation configuration within the master template.
- Fetches draft notice configurations for specified child notices.
- For each child notice and specified regulation(s) within it:

  - Takes the master text.
  - Replaces predefined placeholder strings (macros) with specific values defined for that child notice and locale.
  - Updates the corresponding regulation configuration in the child notice's draft configuration with the processed text.

- Provides a dry run mode to preview changes without making actual API calls.

- Prompts for confirmation before applying updates.

## How it Works (Order of Operations)

1. **Configuration Load:** Reads settings from `config.json`.
2. **Validation:** Checks if an API token is provided and logs if dry run mode is active.
3. **Master Notice Processing:**

  - Fetches the master notice details and its draft configuration using `masterNoticeId` from the config.
  - Identifies regulation configurations within the master notice that are marked as default, are enabled (not `disabled_at`), and have geo-locations defined.
  - If multiple suitable regulation configurations are found, it prompts the user to select one via the console.
  - Extracts the text content (mapping locales to strings) and the list of available locales from the selected master regulation configuration.

4. **Child Notice Configuration Fetching:** Fetches the draft notice configurations for all notices listed in the `childrenNotices` array in the config.

5. **Processing Children & Generating Updates:**

  - Iterates through each child notice defined in the configuration.
  - For each child notice, it iterates through the `regulationIds` specified for it in the config.
  - For each specified `regulationId`, it finds the corresponding default, enabled regulation configuration within the child notice's draft config.
  - It then iterates through the `macros` defined for the child notice.
  - For each macro `key` and its translatable `value` (locale -> replacement string):

    - It verifies that the locale exists in the master text.
    - It verifies that the macro `key` exists within the master text for that locale.
    - It replaces the `key` with the `replacement string` in the master text for that locale.
    - It compares the resulting text with the _existing_ text (if any) for that locale in the child regulation configuration. If they differ, it marks that changes are needed.
    - The processed text for all locales defined in the macro's `value` is prepared.

  - The script sets the prepared text into the child's regulation configuration object (specifically within `config.notice.content`). The exact key (`popup` or `notice`) depends on the notice platform and position.

  - If any changes were detected during macro processing for any specified regulation, an "update" function is created for this child notice configuration.

6. **Confirmation:** If any update functions were created, the script lists how many notice configurations will be updated and prompts the user for confirmation (y/n) in the console.

7. **Applying Updates:** If the user confirms:

  - The script iterates through the created update functions.
  - Each function calls the API (via `PATCH /widgets/notices/configs/{config_id}`) to save the modified child notice configuration, unless `dryRun` is true.
  - Logs success or dry run status for each update.

8. **Completion:** Logs completion status.

## How to Use

1. **Install Dependencies:**

  ```bash
  npm install axios # Or yarn add axios
  ```

2. **Configure `config.json`:**

  - `baseUrl` (string): The base URL for the Didomi API (e.g., `"https://api.didomi.io"` or `"https://api-staging.didomi.io"`).
  - `dryRun` (boolean): Set to `true` to log intended actions without making changes. Set to `false` to apply changes via the API.
  - `token` (string): Your Didomi API authorization token, prefixed with `Bearer` (e.g., `"Bearer eyJ..."`). **Handle this securely.**
  - `masterNoticeId` (string): The ID of the notice whose draft configuration will serve as the template.
  - `childrenNotices` (array): A list of child notice objects to update.

    - `noticeId` (string): The ID of the child notice.
    - `regulationIds` (array of strings): A list of regulation IDs (e.g., `"gdpr"`, `"ccpa"`) within this child notice where the template should be applied. The script targets the _default, enabled_ configuration for each listed ID.
    - `macros` (array of objects): Placeholders to replace in the master text.

      - `key` (string): The exact placeholder string in the master text (e.g., `"{{COMPANY_NAME}}"`).
      - `value` (object): An object mapping locale codes (e.g., `"en"`, `"fr"`) to the replacement strings for that locale. The locales used here **must** exist in the master template text.

  **Example `config.json`:**

  ```json
  {
  "baseUrl": "https://api-staging.didomi.io",
  "dryRun": true,
  "token": "Bearer YOUR_API_TOKEN_HERE",
  "masterNoticeId": "MasterNotice123",
  "childrenNotices": [
    {
      "noticeId": "ChildNoticeABC",
      "regulationIds": ["gdpr"],
      "macros": [
        {
          "key": "{{PRIVACY_POLICY_URL}}",
          "value": {
            "en": "https://example.com/privacy-en",
            "es": "https://example.com/privacy-es"
          }
        },
        {
          "key": "{{COMPANY_NAME}}",
          "value": {
            "en": "My Example Corp",
            "es": "Mi Corporación Ejemplo"
          }
        }
      ]
    },
    {
      "noticeId": "ChildNoticeXYZ",
      "regulationIds": ["gdpr", "ccpa"],
      "macros": [
        {
          "key": "{{PRIVACY_POLICY_URL}}",
          "value": {
            "en": "https://another-site.org/privacy"
          }
        },
         {
          "key": "{{COMPANY_NAME}}",
          "value": {
            "en": "Another Org Inc."
          }
        }
      ]
    }
  ]
  }
  ```

3. **Run the Script:**

  ```bash
  node apply-custom-text-template.js
  ```

  The script will output progress, prompt for selection if needed, ask for confirmation (if not in dry run and changes are detected), and report the results.
