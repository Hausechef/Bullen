const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'src/app/trading/i18n/config.ts');
let code = fs.readFileSync(configPath, 'utf8').replace(/\r\n/g, '\n');

const adminSettingsEN = `
        adminSettings: {
          title: "System Configuration",
          desc: "Manage platform-wide settings, security policies, and AI features.",
          platform: {
            title: "Platform Defaults",
            balance: "Default Starting Balance",
            save: "Save",
            maintenance: "Maintenance Mode",
            enable: "Enable",
            balanceUpdated: "Starting balance updated successfully",
            maintenanceFlipped: "Maintenance Mode status flipped"
          },
          ai: {
            title: "AI Live Chat",
            desc: "Navigation assistant powered by OpenRouter. API key is secured server-side — never exposed to the browser.",
            checking: "Checking…",
            active: "OpenRouter — Server key active",
            notConfigured: "AI service not configured",
            freeTier: "Free tier · No per-request cost",
            modelTitle: "Model (Free tier)",
            saving: "Saving…",
            savePref: "Save Model Preference",
            savedToast: "AI model preference saved",
            models: {
              deepseek: "DeepSeek V4 Flash — Free (recommended)",
              gpt20: "OpenAI GPT-OSS 20B — Free",
              gpt120: "OpenAI GPT-OSS 120B — Free (slowest)"
            }
          },
          security: {
            title: "Security Policies",
            mfaTitle: "Require MFA for Admins",
            mfaDesc: "Enforce hardware keys or TOTP",
            mfaEnabled: "Require MFA Enabled",
            mfaDisabled: "Require MFA Disabled",
            banTitle: "Auto-Ban Flagged IPs",
            banDesc: "Block VPNs and bad actors",
            banEnabled: "Auto-Ban Enabled",
            banDisabled: "Auto-Ban Disabled"
          }
        },`;

const adminSettingsDE = `
        adminSettings: {
          title: "Systemkonfiguration",
          desc: "Verwalten Sie plattformweite Einstellungen, Sicherheitsrichtlinien und KI-Funktionen.",
          platform: {
            title: "Plattform-Standards",
            balance: "Standard-Startguthaben",
            save: "Speichern",
            maintenance: "Wartungsmodus",
            enable: "Aktivieren",
            balanceUpdated: "Startguthaben erfolgreich aktualisiert",
            maintenanceFlipped: "Wartungsmodus-Status umgeschaltet"
          },
          ai: {
            title: "KI-Live-Chat",
            desc: "Navigationsassistent unterstützt von OpenRouter. Der API-Schlüssel ist serverseitig gesichert — er wird dem Browser nie zugänglich gemacht.",
            checking: "Wird überprüft…",
            active: "OpenRouter — Serverschlüssel aktiv",
            notConfigured: "KI-Dienst nicht konfiguriert",
            freeTier: "Kostenlose Stufe · Keine Kosten pro Anfrage",
            modelTitle: "Modell (Kostenlose Stufe)",
            saving: "Speichern…",
            savePref: "Modelleinstellung speichern",
            savedToast: "KI-Modelleinstellung gespeichert",
            models: {
              deepseek: "DeepSeek V4 Flash — Kostenlos (empfohlen)",
              gpt20: "OpenAI GPT-OSS 20B — Kostenlos",
              gpt120: "OpenAI GPT-OSS 120B — Kostenlos (am langsamsten)"
            }
          },
          security: {
            title: "Sicherheitsrichtlinien",
            mfaTitle: "MFA für Admins anfordern",
            mfaDesc: "Hardware-Schlüssel oder TOTP erzwingen",
            mfaEnabled: "MFA-Anforderung aktiviert",
            mfaDisabled: "MFA-Anforderung deaktiviert",
            banTitle: "Markierte IPs automatisch sperren",
            banDesc: "VPNs und böswillige Akteure blockieren",
            banEnabled: "Auto-Bann aktiviert",
            banDisabled: "Auto-Bann deaktiviert"
          }
        },`;

if (!code.includes('adminSettings: {')) {
  // Inject into EN
  code = code.replace(/(\n\s*)adminDashboard: \{/, adminSettingsEN + "$1adminDashboard: {");
  
  // Inject into DE
  let deIndex = code.indexOf("de: {");
  let deBlock = code.substring(deIndex);
  deBlock = deBlock.replace(/(\n\s*)adminDashboard: \{/, adminSettingsDE + "$1adminDashboard: {");
  
  code = code.substring(0, deIndex) + deBlock;
  fs.writeFileSync(configPath, code);
  console.log("Injected adminSettings into config.ts");
}
