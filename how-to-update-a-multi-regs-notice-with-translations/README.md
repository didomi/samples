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

3. Replace placeholder texts from both files such as `<YOUR_API_TOKEN>`, `<NOTICE_ID>`, `<PRIVATE_API_KEY_ID>`, and others with actual values relevant to your environment.

## Usage

This project supports handling translations for the following entities:

- [Purposes](https://api.didomi.io/docs/#/purposes/get_metadata_purposes)
- [Notice Configs](https://api.didomi.io/docs/#/notices/get_widgets_notices_configs)

Each entity, supports two types of commands:

- `pull`: Fetching the entity from the Didomi API using the specified configuration and downloading the translatable properties into a JSON file.
- `push`: Reading a translations JSON file and updating the entity in the Didomi API using the specified configuration. Keep in mind that a input JSON file must exist before executing this command.

### Commands

There are four (4) commands currently available in this project:

**1. Pull translations for a notice config**

```shell
npm run notice:pull
# Stores translations in data/notice_translations_input.json
```

**2. Push translations for a notice config**

```shell
npm run notice:push
# Reads translations from data/notice_translations_output.json
```

**3. Pull translations for the list of purposes**

```shell
npm run purposes:push
# Stores translations in data/purposes_translations_input.json
```

**4. Push translations for the list of purposes**

```shell
npm run purposes:pull
# Reads translations from data/purposes_translations_output.json
```
