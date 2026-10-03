const fs = require('fs');

let config = fs.readFileSync('./src/app/trading/i18n/config.ts', 'utf8');

// For EN
config = config.replace(
  /requestProcessing:\s*'Your request is being processed.'\n\s*},\n\s*adminPremarket:/,
  `requestProcessing: 'Your request is being processed.',\n        adminPremarket:`
);

// We need to close 'common' before 'crm: crmDictionaries.en'
config = config.replace(
  /\n\s*},\n\s*crm:\s*crmDictionaries\.en/,
  `\n        }\n      },\n      crm: crmDictionaries.en`
);

// For DE
config = config.replace(
  /requestProcessing:\s*'Ihre Anfrage wird bearbeitet.'\n\s*},\n\s*adminPremarket:/,
  `requestProcessing: 'Ihre Anfrage wird bearbeitet.',\n        adminPremarket:`
);

// We need to close 'common' before the end of DE
config = config.replace(
  /\n\s*},\n\s*crm:\s*crmDictionaries\.de/,
  `\n        }\n      },\n      crm: crmDictionaries.de`
);

fs.writeFileSync('./src/app/trading/i18n/config.ts', config);
console.log('Fixed config.ts');
