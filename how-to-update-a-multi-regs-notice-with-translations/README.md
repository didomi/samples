# Update a Multi-Regulations Consent Notice with Translations

This guide demonstrates how to use a script to update the content of a multi-regulations consent notice by leveraging translation files. The script communicates with the Didomi API to retrieve and update configuration information. After updates are applied, you must publish the changes manually through the Didomi console or automate the process by creating a new deployment on `/widgets/notices/deployments` (more information can be found here: https://developers.didomi.io/api/widgets/consent-notices/tutorials/tutorial-1#publish-the-notice).

## Prerequisites

- Node.js 16 or later

## Installation

1. Clone this repo or download the source code to your local machine.
2. Navigate to the project's root directory in your terminal.
3. Run `npm install` to install all dependencies required for the script to work.

## Configuration

To set up the script correctly, follow these steps:

1. Update the `config.js` file with your specific settings in the folder `src/config` of the project root directory.

```javascript
module.exports = {
  // Base URL of the Didomi API
  baseUrl: "https://api.didomi.io/v1",

  // ...

  // The identifier for the notice you want to update
  noticeId: "<NOTICE_ID>", // Replace with the actual Notice ID

  // The identifier of your organization within Didomi
  organizationId: "<ORGANIZATION_ID>", // Replace with the actual Organization ID

  // The path where the retrieved translations are stored
  translationsPath: "./data/notice_translations_input.json",
};
```

2. Create a new `secrets.js` file in the folder `src/config`. You can copy the content of the template file `secrets.template.js`.

```javascript
module.exports = {
  // Secrets to authenticate with the Didomi API
  id: "<PRIVATE_API_KEY_ID>", // Replace with your actual API Key ID

  secret: "<PRIVATE_API_KEY_SECRET>", // Replace with your actual API Key Secret
};
```

3. Replace placeholder texts from both files such as `<NOTICE_ID>`, `<ORGANIZATION_ID>`, `<PRIVATE_API_KEY_ID>`, `<PRIVATE_API_KEY_SECRET>` and others with actual values relevant to your environment.

## Usage

This project supports handling translations for the following entities:

- [Purposes](https://api.didomi.io/docs/#/purposes/get_metadata_purposes)
- [Notice Configs](https://api.didomi.io/docs/#/notices/get_widgets_notices_configs)

Each entity supports three types of commands:

- `pull`: Fetching the entity from the Didomi API using the specified configuration and downloading the translatable properties into a JSON file.
- `push`: Reading a translations JSON file for a given language and updating the entity in the Didomi API using the specified configuration. The `--language` and `--filename` command-line parameters must be specified.
- _(only on notice)_ `macros`: Perform macro substitutions in child notices using a master notice as the source and values from `macros.json`. Supports `--language`, `--language=all`, and optional `--dry-run=true` mode.

### Commands

There are five (5) commands currently available in this project:

**1. Pull translations for a notice config**

```shell
npm run notice:pull
# Stores translations in data/notice_translations_input.json
```

**2. Push translations for a notice config**

```shell
npm run notice:push --language=fr --filename=notice_translations_fr.json
# Reads translations from notice_translations_fr.json
```

**3. Pull translations for the list of purposes**

```shell
npm run purposes:pull
# Stores translations in data/purposes_translations_input.json
```

**4. Push translations for the list of purposes**

```shell
npm run purposes:push --language=es --filename=purposes_translations_es.json
# Reads translations from purposes_translations_es.json
```

**5. Replace macros across child notices**

```bash
npm run notice:macros --language=fr
# Uses macros.json to replace variables in translations across multiple notices
```

##### Description

The `notice:macros` command allows you to perform macro substitution in child notices using a single master notice as the base. This is especially useful when managing multiple brands or variations of a consent notice that only differ by small dynamic content like brand names or partner URLs.

Each macro is defined per notice in the file: `src/config/macros.json`.

##### Example

```json
{
  "childrenNotices": [
    {
      "noticeId": "abc123",
      "macros": [
        { "key": "[BRAND_NAME]", "value": "Brand A" },
        {
          "key": "[LINK_PARTNERS]",
          "value": {
            "en": "https://brand-a.com",
            "fr": "https://brand-a.fr"
          }
        }
      ]
    }
  ]
}
```

##### Available CLI options

| Option             | Description                                                         |
| ------------------ | ------------------------------------------------------------------- |
| `--language=fr`    | Run macro replacement for a specific language                       |
| `--language=fr,en` | Run macro replacement for multiple comma-separated languages        |
| `--language=all`   | Run for all enabled languages from the master notice config         |
| `--dry-run=true`   | Simulate the replacement process without pushing updates to the API |

##### Example Usage

```bash
npm run notice:macros --language=all --dry-run=true
```

This command will:

- Fetch translations from the master notice
- Replace defined macros per child notice
- Print updated configurations to the console
- Skip sending API updates due to `--dry-run=true`

> ⚠️ **Note:** If a macro value is missing for the selected language, the script will throw an error.
> ⚠️ **Warning:** Unused macros will be logged to the console for visibility.
