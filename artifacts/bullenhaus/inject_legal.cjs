const fs = require('fs');

let config = fs.readFileSync('./src/app/trading/i18n/config.ts', 'utf8');

const enLegal = `
        legal: {
          nav: {
            contact: "Contact & Compliance",
            terms: "Terms of Service",
            privacy: "Privacy Policy",
            aml: "AML & Compliance",
            corporate: "Corporate Data"
          },
          backToPlatform: "Back to Platform",
          documentation: "Legal Documentation",
          lastUpdated: "Last Updated",
          allRightsReserved: "All rights reserved."
        },`;

const deLegal = `
        legal: {
          nav: {
            contact: "Kontakt & Compliance",
            terms: "Nutzungsbedingungen",
            privacy: "Datenschutzerklärung",
            aml: "AML & Compliance",
            corporate: "Unternehmensdaten"
          },
          backToPlatform: "Zurück zur Plattform",
          documentation: "Rechtliche Dokumentation",
          lastUpdated: "Zuletzt aktualisiert",
          allRightsReserved: "Alle Rechte vorbehalten."
        },`;

// Find end of EN auth
config = config.replace(
  /(auth: {[\s\S]*?savePasswordBtn: "Save password"\n          }\n        }),/,
  `$1,\n${enLegal}`
);

// Find end of DE auth
config = config.replace(
  /(auth: {[\s\S]*?savePasswordBtn: "Passwort speichern"\n          }\n        }),/,
  `$1,\n${deLegal}`
);

fs.writeFileSync('./src/app/trading/i18n/config.ts', config);
console.log('Injected Legal translations');
