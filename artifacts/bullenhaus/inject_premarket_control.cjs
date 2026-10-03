const fs = require('fs');

let config = fs.readFileSync('./src/app/trading/i18n/config.ts', 'utf8');

// Insert EN
config = config.replace(
  /marketControl: "Market Control",/,
  `marketControl: "Market Control",\n            preMarketControl: "Pre-Market Control",`
);

// Insert DE
config = config.replace(
  /marketControl: "Marktsteuerung",/,
  `marketControl: "Marktsteuerung",\n            preMarketControl: "Pre-Market Steuerung",`
);

fs.writeFileSync('./src/app/trading/i18n/config.ts', config);
console.log('Injected preMarketControl translation');
