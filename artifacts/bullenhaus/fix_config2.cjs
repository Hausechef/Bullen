const fs = require('fs');
let code = fs.readFileSync('./src/app/trading/i18n/config.ts', 'utf8');

// First, find all occurrences of adminMarket and remove them completely. 
// Actually, it's easier to use a regex to replace the first one for EN and the second one for DE.
// BUT we also injected an extra one at the end of the file maybe? Let's just remove the one at the end if it exists.

const enBlock = `adminMarket: {
          title: "Market Control",
          desc: "Override market trends, volatility, and spreads for simulation pairs.",
          toast: {
            symbolReq: "Symbol required",
            removed: "Removed override for {{symbol}}",
            set: "Override set: {{symbol}} = {{price}}",
            failedGlobal: "Failed to update override for {{symbol}}",
            pinFailed: "Failed to pin {{symbol}}",
            unpinFailed: "Failed to unpin {{symbol}}",
            trendFailed: "Failed to update trend",
            volFailed: "Failed to update volatility",
            spreadFailed: "Failed to update spread",
            confirmReset: "Reset market feed to default?",
            resetOk: "Market reset for {{sym}}",
            resetFail: "Failed to reset market",
            pauseFail: "Failed to pause feed",
            invalidPrice: "Invalid price"
          },
          engine: {
            title: "Crypto, Forex & Metals Simulation Engine",
            freezeNotice: "Simulation frozen while pinned",
            global: {
              title: "Global Market Overrides",
              adminTool: "Admin Manipulation Tool",
              symbolLabel: "Asset Symbol",
              priceLabel: "Fixed Price",
              fixBtn: "Fix Price"
            },
            tabs: {
              crypto: "Crypto",
              forex: "Forex",
              metals: "Metals"
            },
            cards: {
              liveRate: "Live Rate",
              fixedRate: "Fixed Rate",
              unpinDesc: "Remove fix & resume live feed",
              pinDesc: "Fix price at {{price}} & halt feed",
              setCustomPin: "Set custom pin",
              pauseFeed: "Pause Feed",
              resumeFeed: "Resume Feed",
              trend: "Trend Bias",
              trendNeutral: "Neutral",
              trendBull: "Bullish (+{{val}}%)",
              trendBear: "Bearish ({{val}}%)",
              volatility: "Volatility ({{val}}%)",
              spread: "Spread Markup ({{val}}%)",
              unfix: "Unpin Rate",
              fixedBadge: "FIXED",
              reset: "Reset Market Feed",
              resetBtn: "Reset",
              fixPriceLabel: "Fixed Price",
              pricePlaceholder: "e.g. {{price}}",
              fix: "Fix",
              scenarios: "Market Scenarios"
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

const deBlock = `adminMarket: {
          title: "Marktkontrolle",
          desc: "Überschreiben Sie Markttrends, Volatilität und Spreads für Simulationspaare.",
          toast: {
            symbolReq: "Symbol erforderlich",
            removed: "Überschreibung für {{symbol}} entfernt",
            set: "Überschreibung gesetzt: {{symbol}} = {{price}}",
            failedGlobal: "Fehler beim Aktualisieren der Überschreibung für {{symbol}}",
            pinFailed: "Fehler beim Anheften von {{symbol}}",
            unpinFailed: "Fehler beim Lösen von {{symbol}}",
            trendFailed: "Fehler beim Aktualisieren des Trends",
            volFailed: "Fehler beim Aktualisieren der Volatilität",
            spreadFailed: "Fehler beim Aktualisieren des Spreads",
            confirmReset: "Markt-Feed auf Standard zurücksetzen?",
            resetOk: "Markt für {{sym}} zurückgesetzt",
            resetFail: "Fehler beim Zurücksetzen des Marktes",
            pauseFail: "Fehler beim Pausieren des Feeds",
            invalidPrice: "Ungültiger Preis"
          },
          engine: {
            title: "Krypto-, Forex- & Metall-Simulations-Engine",
            freezeNotice: "Simulation während der Fixierung eingefroren",
            global: {
              title: "Globale Markt-Überschreibungen",
              adminTool: "Admin-Manipulationswerkzeug",
              symbolLabel: "Asset-Symbol",
              priceLabel: "Fester Preis",
              fixBtn: "Preis festlegen"
            },
            tabs: {
              crypto: "Krypto",
              forex: "Forex",
              metals: "Metalle"
            },
            cards: {
              liveRate: "Live-Kurs",
              fixedRate: "Fester Kurs",
              unpinDesc: "Fixierung entfernen & Live-Feed fortsetzen",
              pinDesc: "Preis bei {{price}} fixieren & Feed anhalten",
              setCustomPin: "Benutzerdefinierten Pin setzen",
              pauseFeed: "Feed pausieren",
              resumeFeed: "Feed fortsetzen",
              trend: "Trendausrichtung",
              trendNeutral: "Neutral",
              trendBull: "Bullisch (+{{val}}%)",
              trendBear: "Bärisch ({{val}}%)",
              volatility: "Volatilität ({{val}}%)",
              spread: "Spread-Aufschlag ({{val}}%)",
              unfix: "Kurs lösen",
              fixedBadge: "FIXIERT",
              reset: "Markt-Feed zurücksetzen",
              resetBtn: "Zurücksetzen",
              fixPriceLabel: "Fester Preis",
              pricePlaceholder: "z.B. {{price}}",
              fix: "Festlegen",
              scenarios: "Marktszenarien"
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

let adminMarketCount = 0;
code = code.replace(/adminMarket:\s*\{[\s\S]*?\}(?=,\s*adminCrm:)/g, (match) => {
  adminMarketCount++;
  if (adminMarketCount === 1) return enBlock.slice(0, -1);
  if (adminMarketCount === 2) return deBlock.slice(0, -1);
  return match;
});

// Delete any trailing adminMarket block if I accidentally added one at the very end.
code = code.replace(/adminMarket:\s*\{\s*engine:\s*\{\s*cards:[\s\S]*?\}\s*\},?/g, '');

fs.writeFileSync('./src/app/trading/i18n/config.ts', code);
