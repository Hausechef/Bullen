const fs = require('fs');

let config = fs.readFileSync('./src/app/trading/i18n/config.ts', 'utf8');

const enAdminMarket = `
        adminMarket: {
          title: "Market Engine Control",
          desc: "Real-time algorithmic parameters for forex and crypto pairs.",
          toast: {
            pinnedOk: "Market pinned",
            pinnedFail: "Failed to pin",
            unfixedOk: "Market unpinned",
            unfixedFail: "Failed to unpin",
            volFailed: "Failed to set volatility",
            spreadFailed: "Failed to set spread",
            trendFailed: "Failed to set trend"
          },
          engine: {
            cards: {
              livePin: "LIVE PIN",
              pin: "Pin Rate",
              unfix: "Unpin Rate",
              volatility: "Volatility Multiplier",
              spread: "Base Spread",
              scenarios: "Market Scenarios",
              confirmCrash: "DANGER: Initiate Flash Crash on {{sym}}?"
            },
            scenarios: {
              bull: "BULL RUN",
              bear: "BEAR MARKET",
              sideways: "SIDEWAYS",
              crash: "FLASH CRASH",
              news: "NEWS EVENT"
            }
          }
        },`;

const deAdminMarket = `
        adminMarket: {
          title: "Markt-Engine Kontrolle",
          desc: "Echtzeit-algorithmische Parameter für Forex- und Krypto-Paare.",
          toast: {
            pinnedOk: "Markt fixiert",
            pinnedFail: "Fixierung fehlgeschlagen",
            unfixedOk: "Markt gelöst",
            unfixedFail: "Lösen fehlgeschlagen",
            volFailed: "Volatilität setzen fehlgeschlagen",
            spreadFailed: "Spread setzen fehlgeschlagen",
            trendFailed: "Trend setzen fehlgeschlagen"
          },
          engine: {
            cards: {
              livePin: "LIVE FIXIERUNG",
              pin: "Kurs fixieren",
              unfix: "Kurs lösen",
              volatility: "Volatilitäts-Multiplikator",
              spread: "Basis-Spread",
              scenarios: "Marktszenarien",
              confirmCrash: "GEFAHR: Flash Crash für {{sym}} einleiten?"
            },
            scenarios: {
              bull: "BULLENMARKT",
              bear: "BÄRENMARKT",
              sideways: "SEITWÄRTS",
              crash: "FLASH CRASH",
              news: "NACHRICHTENEREIGNIS"
            }
          }
        },`;

// Find end of EN legal
config = config.replace(
  /(legal: {[\s\S]*?allRightsReserved: "All rights reserved."\n        }),/,
  `$1,\n${enAdminMarket}`
);

// Find end of DE legal
config = config.replace(
  /(legal: {[\s\S]*?allRightsReserved: "Alle Rechte vorbehalten."\n        }),/,
  `$1,\n${deAdminMarket}`
);

fs.writeFileSync('./src/app/trading/i18n/config.ts', config);
console.log('Injected AdminMarket translations');
