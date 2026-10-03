const fs = require('fs');

const configPath = './src/app/trading/i18n/config.ts';
let config = fs.readFileSync(configPath, 'utf8');

const enAdminLayout = `
        adminLayout: {
          sidebar: {
            admin: "ADMIN",
            controlSystem: "Control System",
            overview: "Overview",
            userManager: "User Manager",
            kycQueue: "KYC Queue",
            deposits: "Deposits",
            withdrawals: "Withdrawals",
            marketControl: "Market Control",
            transactions: "Transactions",
            systemConfig: "System Config",
            switchZone: "SWITCH ZONE",
            tradePlatform: "Trade Platform",
            crmAdmin: "CRM Admin",
            signOut: "Sign Out"
          }
        },`;

const deAdminLayout = `
        adminLayout: {
          sidebar: {
            admin: "ADMIN",
            controlSystem: "Kontrollsystem",
            overview: "Übersicht",
            userManager: "Benutzerverwaltung",
            kycQueue: "KYC-Warteschlange",
            deposits: "Einzahlungen",
            withdrawals: "Auszahlungen",
            marketControl: "Marktkontrolle",
            transactions: "Transaktionen",
            systemConfig: "Systemkonfiguration",
            switchZone: "BEREICH WECHSELN",
            tradePlatform: "Handelsplattform",
            crmAdmin: "CRM-Admin",
            signOut: "Abmelden"
          }
        },`;

if (!config.includes('adminLayout: {')) {
  config = config.replace(
    /(common: {[\s\S]*?\n        },)/,
    `$1${enAdminLayout}`
  );
  config = config.replace(
    /(de: {\s*common: {[\s\S]*?\n        },)/,
    `$1${deAdminLayout}`
  );
  fs.writeFileSync(configPath, config);
  console.log("Injected adminLayout into config.ts");
} else {
  console.log("adminLayout already exists in config.ts");
}
