const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'src/app/trading/i18n/config.ts');
let code = fs.readFileSync(configPath, 'utf8').replace(/\r\n/g, '\n');

const adminMarketEN = `
        adminMarket: {
          title: "Market Control",
          desc: "Override market trends, volatility, and spreads for simulation pairs.",
          globalTitle: "Global Market Overrides",
          adminTool: "Admin Manipulation Tool",
          symbolLabel: "Asset Symbol (e.g. BTCUSDT, XAUUSD, EURUSD)",
          fixedPriceLabel: "Fixed Price (leave empty to remove override)",
          fixPriceBtn: "Fix Price",
          toast: {
            symbolReq: "Symbol required",
            removed: "Removed override for {{symbol}}",
            set: "Override set: {{symbol}} = {{price}}",
            failedGlobal: "Failed to update override for {{symbol}}",
            pinFailed: "Failed to pin {{symbol}}",
            unpinFailed: "Failed to unpin {{symbol}}",
            trendFailed: "Failed to update trend",
            volFailed: "Failed to update volatility",
            spreadFailed: "Failed to update spread"
          },
          engine: {
            title: "Crypto, Forex & Metals Simulation Engine",
            pinnedHint: "Pinned pairs are frozen — simulation + API won't override",
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
              spread: "Spread Markup ({{val}}%)"
            }
          }
        },`;

const adminMarketDE = `
        adminMarket: {
          title: "Marktkontrolle",
          desc: "Überschreiben Sie Markttrends, Volatilität und Spreads für Simulationspaare.",
          globalTitle: "Globale Markt-Überschreibungen",
          adminTool: "Admin-Manipulationswerkzeug",
          symbolLabel: "Asset-Symbol (z.B. BTCUSDT, XAUUSD, EURUSD)",
          fixedPriceLabel: "Fester Preis (leer lassen, um Überschreibung zu entfernen)",
          fixPriceBtn: "Preis festlegen",
          toast: {
            symbolReq: "Symbol erforderlich",
            removed: "Überschreibung für {{symbol}} entfernt",
            set: "Überschreibung gesetzt: {{symbol}} = {{price}}",
            failedGlobal: "Fehler beim Aktualisieren der Überschreibung für {{symbol}}",
            pinFailed: "Fehler beim Anheften von {{symbol}}",
            unpinFailed: "Fehler beim Lösen von {{symbol}}",
            trendFailed: "Fehler beim Aktualisieren des Trends",
            volFailed: "Fehler beim Aktualisieren der Volatilität",
            spreadFailed: "Fehler beim Aktualisieren des Spreads"
          },
          engine: {
            title: "Krypto-, Forex- & Metall-Simulations-Engine",
            pinnedHint: "Angeheftete Paare sind eingefroren — Simulation + API überschreiben nicht",
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
              spread: "Spread-Aufschlag ({{val}}%)"
            }
          }
        },`;

if (!code.includes('adminMarket: {')) {
  // Inject into EN
  code = code.replace(/(\n\s*)adminTx: \{/, adminMarketEN + "$1adminTx: {");
  
  // Inject into DE
  let deIndex = code.indexOf("de: {");
  let deBlock = code.substring(deIndex);
  deBlock = deBlock.replace(/(\n\s*)adminTx: \{/, adminMarketDE + "$1adminTx: {");
  
  code = code.substring(0, deIndex) + deBlock;
  fs.writeFileSync(configPath, code);
  console.log("Injected adminMarket into config.ts");
}
