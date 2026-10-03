import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { crmDictionaries } from '../../crm/lib/i18n';

const savedLang = (() => {
  try { return localStorage.getItem('i18n-lang') || 'en'; } catch { return 'en'; }
})();

i18n
  .use(initReactI18next)
  .init({
    lng: savedLang,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'crm'],
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        common: {
          legal: {
            backToPlatform: "Back to Platform",
            documentation: "Legal Documentation",
            lastUpdated: "Last updated",
            allRightsReserved: "All rights reserved.",
            nav: {
              contact: "Contact & Compliance",
              terms: "Terms of Service",
              privacy: "Privacy Policy",
              aml: "AML Policy",
              corporate: "Corporate Data",
            },
          },
          auth: {
            forgotPassword: {
              title: "Reset Password",
              subtitle: "Enter your email and we'll send you a link to reset your passphrase.",
              emailLabel: "Email Address",
              emailPlaceholder: "name@example.com",
              sendLinkBtn: "Send Reset Link",
              backToLogin: "Back to Login",
              successTitle: "Check Your Email",
              successSubtitle1: "If an account exists for that address, a password reset link is on its way.",
              successSubtitle2: "The link expires in 60 minutes. Check your spam folder if you don't see it.",
              errors: {
                tooManyRequests: "Too many requests. Please wait a moment and try again.",
                invalidEmail: "Please enter a valid email address.",
                default: "Could not send the reset link. Please try again.",
              },
            },
            register: {
              title: "Create Account",
              subtitle: "Start your trading journey with Bullenhaus",
              firstNameLabel: "First Name",
              firstNamePlaceholder: "John",
              lastNameLabel: "Last Name",
              lastNamePlaceholder: "Doe",
              countryLabel: "Country",
              countryPlaceholder: "Select Country",
              phoneLabel: "Phone Number",
              phonePlaceholder: "Phone number",
              phoneDisabledPlaceholder: "Select country first",
              phoneStoredAs: "Stored as:",
              emailLabel: "Email Address",
              emailPlaceholder: "name@example.com",
              passwordLabel: "Password",
              passwordPlaceholder: "••••••••",
              submitBtn: "Create Account",
              hasAccount: "Already have an account?",
              loginBtn: "Log In",
              successTitle: "Account Created!",
              successSubtitle: "Your account has been created successfully.",
              returnToLogin: "Return to Login",
              errors: {
                firstNameRequired: "First name is required",
                lastNameRequired: "Last name is required",
                countryRequired: "Country is required",
                phoneRequired: "Phone number is required",
                registerFailed: "Registration failed. Please try again."
              }
            }
          },
          dashboard: 'Dashboard',
          markets: 'Markets',
          trade: 'Trade',
          portfolio: 'Portfolio',
          wallet: 'Wallet',
          transactions: 'Transactions',
          rewards: 'Rewards',
          academy: 'Academy',
          leaderboard: 'Leaderboard',
          referrals: 'Referrals',
          notifications: 'Notifications',
          kyc: 'KYC Verification',
          profile: 'Profile',
          settings: 'Settings',
          help: 'Help & Support',
          buy: 'Buy',
          sell: 'Sell',
          deposit: 'Deposit',
          withdraw: 'Withdraw',
          submit: 'Submit',
          cancel: 'Cancel',
          search: 'Search',
          logout: 'Logout',
          admin: 'Command Center',
          action: 'Action',
          livePrices: 'Live Prices and Market Performance',
          tradeAction: 'Trade',
          type: 'Type',
          amount: 'Amount',
          status: 'Status',
          date: 'Date',
          transaction: 'Transaction',
          completed: 'Completed',
          pending: 'Pending',
          fee: 'Fee',
          all: 'All',
          deposits: 'Deposits',
          withdrawals: 'Withdrawals',
          trades: 'Trades',
          premarket: {
            title: "Pre-Market",
            subtitle: "Exclusive Access to Pre-IPO Opportunities",
            buyShares: "Buy Amount (Shares)",
            fixedPrice: "Fixed Price",
            totalCost: "Total Cost",
            successBuy: "Successfully purchased {{amount}} {{symbol}}",
            insufficientFunds: "Insufficient Funds",
            insufficientFundsToast: "Insufficient funds to complete this purchase",
            processing: "Processing...",
            buy: "Buy {{symbol}}",
            loading: "Loading...",
            aboutTitle: "About Pre-Market",
            aboutText: "Pre-Market trading allows eligible clients to acquire shares of highly anticipated companies before their Initial Public Offering (IPO). Prices are fixed by our liquidity providers and settlement is guaranteed.",
            termsTitle: "Terms & Conditions",
            terms: {
              1: "Purchased assets will appear in your Portfolio immediately.",
              2: "Pre-Market assets cannot be sold until the official IPO date.",
              3: "Margin cannot be used for Pre-Market purchases; only available wallet balance is accepted.",
              4: "All purchases are final and non-refundable."
            }
          },
          fees: 'Fees',
          growth: 'Growth',
          account: 'Account',
          totalBalance: 'Total Balance',
          live: 'Live',
          equity: 'Equity',
          unrealizedPnL: 'Unrealized P&L',
          realizedPnL: 'Realized P&L',
          availableMargin: 'Available Margin',
          dashboardDesc: 'Elite trading intelligence for masters of the market.',
          liveAnalysts: 'Live Analysts',
          currentLevel: 'Current Level',
          viewRewards: 'View Rewards',
          next: 'Next',
          launchProtocol: 'Launch Protocol',
          market: 'Market',
          limit: 'Limit',
          stop: 'Stop',
          perpetual: 'Perpetual',
          margin: 'Margin',
          leverage: 'Leverage',
          cross: 'Cross',
          isolated: 'Isolated',
          orderSize: 'Order Size',
          price: 'Price',
          takeProfit: 'Take Profit',
          stopLoss: 'Stop Loss',
          none: 'None',
          marginRequired: 'Margin Required',
          estLiq: 'Est. Liq',
          riskMeter: 'Risk Meter',
          orderBook: 'Order Book',
          recentTrades: 'Recent Trades',
          assetInfo: 'Asset Information',
          fundingRate: 'Funding Rate',
          nextFunding: 'Next Funding',
          openInterest: 'Open Interest',
          vol24h: '24h Vol',
          high24h: '24h High',
          low24h: '24h Low',
          selectAsset: 'Select Asset',
          confirmOrder: 'Confirm Order',
          executeTrade: 'Execute Trade',
          orderSubmitted: 'Order Submitted',
          orderFailed: 'Order Failed',
          modulesCount: '{{count}} Modules',
          beginner: 'Beginner',
          intermediate: 'Intermediate',
          advanced: 'Advanced',
          expert: 'Expert',
          operatorProfile: 'Operator Profile',
          clearanceLevel: 'Clearance Level: {{level}}',
          identityConfig: 'Identity Configuration',
          displayName: 'Display Name',
          updateProtocol: 'Update Protocol',
          localizationUnits: 'Localization & Units',
          advancedSecurity: 'Advanced Security',
          twoFactor: 'Two-Factor Authentication',
          entryHistory: 'Entry History',
          cycleAvatar: 'Cycle Avatar',
          requestProcessing: 'Your request is being processed.',
        adminPremarket: {
          title: "Pre-Market Assets",
          addAsset: "Add Asset",
          editAsset: "Edit Asset",
          newAsset: "New Asset",
          name: "Name",
          symbol: "Symbol",
          priceUsd: "Price (USD)",
          imageUrl: "Image URL",
          description: "Description",
          cancel: "Cancel",
          saveAsset: "Save Asset",
          loadingAssets: "Loading...",
          noAssetsFound: "No Pre-Market assets found. Create one above.",
          tableAsset: "Asset",
          tableSymbol: "Symbol",
          tablePrice: "Price",
          tableActions: "Actions",
          toastFailedLoad: "Failed to load Pre-Market assets",
          toastFillFields: "Please fill in all required fields",
          toastPriceGreater: "Price must be greater than 0",
          toastUpdateSuccess: "Asset updated successfully",
          toastCreateSuccess: "Asset created successfully",
          toastErrorSave: "Error saving asset: ",
          confirmDelete: "Are you sure you want to delete this asset?",
          toastDeleteSuccess: "Asset deleted successfully",
          toastErrorDelete: "Error deleting asset"
        },
        adminUsers: {
          title: "User Directory",
          desc: "Manage all registered users and their permissions.",
          search: "Search UUID, email, name, phone...",
          columns: {
            identity: "Identity",
            contact: "Contact",
            uuid: "UUID",
            role: "Role",
            kyc: "KYC",
            balance: "Balance",
            created: "Created",
            actions: "Actions"
          },
          empty: {
            loading: "Loading users...",
            noUsers: "No users found",
            adjust: "Adjust your search or wait for registrations."
          },
          tooltips: {
            view: "View Details",
            edit: "Edit User",
            addBal: "Add Balance",
            remBal: "Remove Balance"
          },
          details: {
            title: "User Details",
            close: "Close",
            identity: "Identity",
            contact: "Contact",
            noPhone: "No phone",
            noCountry: "No country",
            access: "Access",
            role: "Role",
            wallet: "Wallet"
          },
          actions: {
            editUser: "Edit User",
            addAssets: "Add Assets",
            removeAssets: "Remove Assets",
            editAssets: "Edit Assets",
            cancel: "Cancel",
            saveChanges: "Save Changes",
            saving: "Saving..."
          },
          editModal: {
            title: "Edit User",
            firstName: "First Name",
            lastName: "Last Name",
            displayName: "Display Name",
            phone: "Phone",
            country: "Country",
            role: "Role",
            kycStatus: "KYC Status"
          },
          toasts: {
            userUpdated: "User updated",
            failedUpdateUser: "Failed to update user",
            enterValidAmount: "Enter a valid non-negative amount",
            balanceNegative: "Wallet balance cannot be negative",
            walletUpdated: "Wallet updated",
            failedUpdateWallet: "Failed to update wallet",
            prompts: {
              amountToAdd: "Amount to add for {{name}}",
              amountToRemove: "Amount to remove for {{name}}",
              amountToSet: "Amount to set for {{name}}",
              confirmAdd: "Add ${{amount}} to {{name}}?",
              confirmRemove: "Remove ${{amount}} from {{name}}?",
              confirmSet: "Set ${{amount}} for {{name}}?"
            }
          }
        },
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
        },
        adminPaymentDetails: {
          title: "Send Payment Details",
          tabs: {
            card: "Credit Card",
            iban: "IBAN",
            link: "Link"
          },
          fields: {
            cardNumber: "Card Number *",
            cardHolder: "Cardholder Name *",
            accountHolder: "Account Holder *",
            bankName: "Bank Name",
            bic: "BIC / SWIFT",
            url: "Payment URL *",
            note: "Note (optional)"
          },
          actions: {
            send: "Send to Client",
            sending: "Sending..."
          },
          toast: {
            fillRequired: "Please fill in all required fields",
            sent: "Payment details sent to client",
            failed: "Failed to send details"
          },
          badge: {
            sent: "Sent"
          }
        },
        adminKyc: {
          title: "KYC Review",
          desc: "Review client identity documents and approve or reject verifications.",
          pendingBadge: "{{count}} pending",
          filters: {
            pending: "Pending",
            all: "All Users"
          },
          columns: {
            client: "Client",
            status: "KYC Status",
            balance: "Balance",
            documents: "Documents",
            submitted: "Submitted",
            actions: "Actions"
          },
          empty: {
            loading: "Loading...",
            noPending: "No pending KYC reviews",
            noUsers: "No users found",
            noDocs: "No documents uploaded yet"
          },
          actions: {
            approve: "Approve",
            reject: "Reject"
          },
          toast: {
            loadError: "Could not load: {{error}}",
            approved: "KYC approved for {{email}}",
            approveFailed: "Approval failed",
            rejectConfirm: "Reject KYC for {{email}}?",
            rejected: "KYC rejected for {{email}}",
            rejectFailed: "Rejection failed"
          },
          docs: {
            files: "{{count}} files",
            file: "{{count}} file"
          }
        },
        adminMarket: {
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
        },
        adminCrm: {
          metrics: {
            connection: "CRM Connection",
            notConfigured: "Not Configured",
            na: "N/A",
            uptime: "Uptime (30d)",
            synced: "Events Synced (24h)",
            vsYesterday: "{{val}}% vs yesterday",
            pending: "Pending Retries",
            active: "{{val}} Active",
            deadLetter: "Dead Letter Queue"
          },
          secret: {
            title: "Webhook Signing Secret",
            subtitle: "Secure your data transmissions",
            hide: "Hide Settings",
            configure: "Configure Secrets",
            warningTitle: "Security Warning",
            warningDesc: "Webhook secrets are used to sign requests sent to your CRM. If the secret is compromised, attackers could spoof webhook events. Never share this key or commit it to version control.",
            enable: "Enable Verification",
            enableDesc: "Sign all outgoing payloads with this secret",
            activeKey: "Active Secret Key",
            rotate: "Rotate Secret",
            save: "Save Changes"
          },
          endpoints: {
            title: "Webhook Endpoints",
            none: "No webhook endpoints configured",
            add: "+ Add New Endpoint"
          },
          dataPolicy: {
            title: "Data Handling Policy",
            desc: "Financial figures, such as <1>balances, transaction amounts, and portfolio values</1>, must come from account records or synchronized CRM events before reporting.",
            balanceTitle: "Balance Classification",
            balanceDesc: "Balances synced to the CRM must carry an explicit source and currency classification before reporting.",
            retentionTitle: "Data Retention",
            retentionDesc: "Sync logs are purged every 30 days. PII (KYC data) is transmitted once and never cached locally."
          },
          audit: {
            title: "Audit Log",
            none: "No recent sync events",
            target: "Target: {{user}}",
            retries: "Retries: {{count}}/5",
            forceRetry: "Force Retry",
            viewAll: "View All Logs"
          }
        },
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
            preMarketControl: "Pre-Market Control",
            transactions: "Transactions",
            systemConfig: "System Config",
            switchZone: "Switch Zone",
            tradePlatform: "Trade Platform",
            crmAdmin: "CRM Admin",
            signOut: "Sign Out"
          },
          header: {
            systemStatus: "System Status: ",
            operational: "Operational"
          }
        },
        adminTx: {
          globalTitle: "Global Transactions",
          globalDesc: "Monitor all deposits, withdrawals, and fee collections.",
          searchTx: "Search TXID or user...",
          columns: {
            txid: "TXID",
            user: "User",
            type: "Type",
            amount: "Amount",
            status: "Status",
            date: "Date"
          },
          noRealTx: "No real transactions found.",
          depositsTitle: "Pending Deposits",
          depositsDesc: "Review and approve fiat/crypto deposit requests.",
          withdrawalsTitle: "Pending Withdrawals",
          withdrawalsDesc: "Review and process user withdrawal requests.",
          noPending: "No pending requests found.",
          approve: "Approve",
          reject: "Reject",
          processing: "Processing...",
          approveDepositMsg: "Approve deposit of {{amount}} for {{user}}?",
          rejectDepositMsg: "Reject deposit of {{amount}} for {{user}}?",
          approveWithdrawalMsg: "Approve withdrawal of {{amount}} for {{user}}?",
          rejectWithdrawalMsg: "Reject withdrawal of {{amount}} for {{user}}?",
          toastUpdated: "Request updated successfully",
          toastFailed: "Failed to update request"
        },
        adminDashboard: {
          title: "Command Center",
          sysStatus: "SYS_STATUS: NOMINAL | ",
          rootAccess: "ROOT_ACCESS_GRANTED",
          tabs: {
            overview: "Overview",
            forex: "Market Control",
            premarket: "Pre-Market",
            system: "System"
          },
          cards: {
            totalUsers: "Total Users",
            registeredAccounts: "Registered accounts",
            volumeToday: "Volume Today",
            completedTx: "Completed transactions",
            pendingKyc: "Pending KYC",
            awaitingReview: "Awaiting review",
            pendingTransfers: "Pending Transfers",
            depositsWithdrawals: "Deposits & withdrawals"
          },
          feed: {
            title: "Live Transaction Feed",
            events: "{{count}} events",
            noTx: "No transactions yet",
            unknown: "Unknown"
          },
          alerts: {
            title: "Active Alerts",
            allClear: "All clear — no pending actions",
            kycAlert: "Pending KYC verifications",
            txAlert: "Pending deposit/withdrawal",
            itemsNeedAttention_one: "{{count}} item needs attention",
            itemsNeedAttention_other: "{{count}} items need attention"
          },
          nodes: {
            title: "Global Nodes",
            desc: "Infrastructure telemetry not connected"
          },
          systemDiag: {
            title: "System Diagnostics",
            desc: "Infrastructure metrics require a server-side monitoring agent.<br />Connect a telemetry source to enable this view."
          }
        }
      },
      crm: crmDictionaries.en
    },
    de: {
        common: {
          legal: {
            backToPlatform: "Zurück zur Plattform",
            documentation: "Rechtliche Dokumentation",
            lastUpdated: "Zuletzt aktualisiert",
            allRightsReserved: "Alle Rechte vorbehalten.",
            nav: {
              contact: "Kontakt & Compliance",
              terms: "Nutzungsbedingungen",
              privacy: "Datenschutzrichtlinie",
              aml: "AML-Richtlinie",
              corporate: "Unternehmensdaten",
            },
          },
          auth: {
            forgotPassword: {
              title: "Passwort zurücksetzen",
              subtitle: "Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.",
              emailLabel: "E-Mail-Adresse",
              emailPlaceholder: "name@example.com",
              sendLinkBtn: "Link senden",
              backToLogin: "Zurück zur Anmeldung",
              successTitle: "Überprüfen Sie Ihre E-Mails",
              successSubtitle1: "Falls ein Konto für diese Adresse existiert, ist ein Link zum Zurücksetzen des Passworts unterwegs.",
              successSubtitle2: "Der Link läuft in 60 Minuten ab. Überprüfen Sie Ihren Spam-Ordner, falls Sie ihn nicht sehen.",
              errors: {
                tooManyRequests: "Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.",
                invalidEmail: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
                default: "Der Reset-Link konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
              },
            },
            register: {
              title: "Konto erstellen",
              subtitle: "Beginnen Sie Ihre Handelsreise mit Bullenhaus",
              firstNameLabel: "Vorname",
              firstNamePlaceholder: "Max",
              lastNameLabel: "Nachname",
              lastNamePlaceholder: "Mustermann",
              countryLabel: "Land",
              countryPlaceholder: "Land auswählen",
              phoneLabel: "Telefonnummer",
              phonePlaceholder: "Telefonnummer",
              phoneDisabledPlaceholder: "Zuerst Land auswählen",
              phoneStoredAs: "Gespeichert als:",
              emailLabel: "E-Mail-Adresse",
              emailPlaceholder: "name@beispiel.de",
              passwordLabel: "Passwort",
              passwordPlaceholder: "••••••••",
              submitBtn: "Konto erstellen",
              hasAccount: "Haben Sie bereits ein Konto?",
              loginBtn: "Anmelden",
              successTitle: "Konto erstellt!",
              successSubtitle: "Ihr Konto wurde erfolgreich erstellt.",
              returnToLogin: "Zurück zum Login",
              errors: {
                firstNameRequired: "Vorname ist erforderlich",
                lastNameRequired: "Nachname ist erforderlich",
                countryRequired: "Land ist erforderlich",
                phoneRequired: "Telefonnummer ist erforderlich",
                registerFailed: "Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut."
              }
            }
          },
          dashboard: 'Dashboard',
          markets: 'Märkte',
          trade: 'Handel',
          portfolio: 'Portfolio',
          wallet: 'Brieftasche',
          transactions: 'Transaktionen',
          rewards: 'Belohnungen',
          academy: 'Akademie',
          leaderboard: 'Bestenliste',
          referrals: 'Empfehlungen',
          notifications: 'Benachrichtigungen',
          kyc: 'KYC-Verifizierung',
          profile: 'Profil',
          settings: 'Einstellungen',
          help: 'Hilfe & Support',
          buy: 'Kaufen',
          sell: 'Verkaufen',
          deposit: 'Einzahlung',
          withdraw: 'Auszahlung',
          submit: 'Absenden',
          cancel: 'Abbrechen',
          search: 'Suche',
          logout: 'Abmelden',
          admin: 'Kommandozentrum',
          action: 'Aktion',
          livePrices: 'Live-Preise und Marktentwicklung',
          tradeAction: 'Handeln',
          type: 'Typ',
          amount: 'Betrag',
          status: 'Status',
          date: 'Datum',
          transaction: 'Transaktion',
          completed: 'Abgeschlossen',
          pending: 'Ausstehend',
          fee: 'Gebühr',
          all: 'Alle',
          deposits: 'Einzahlungen',
          withdrawals: 'Auszahlungen',
          trades: 'Handel',
          premarket: {
            title: "Pre-Market",
            subtitle: "Exklusiver Zugang zu Pre-IPO-Möglichkeiten",
            buyShares: "Kaufmenge (Aktien)",
            fixedPrice: "Festpreis",
            totalCost: "Gesamtkosten",
            successBuy: "{{amount}} {{symbol}} erfolgreich gekauft",
            insufficientFunds: "Unzureichendes Guthaben",
            insufficientFundsToast: "Unzureichendes Guthaben für diesen Kauf",
            processing: "Wird bearbeitet...",
            buy: "{{symbol}} kaufen",
            loading: "Laden...",
            aboutTitle: "Über Pre-Market",
            aboutText: "Der Pre-Market-Handel ermöglicht es berechtigten Kunden, Aktien von mit Spannung erwarteten Unternehmen vor ihrem Börsengang (IPO) zu erwerben. Die Preise werden von unseren Liquiditätsanbietern festgelegt und die Abwicklung ist garantiert.",
            termsTitle: "Allgemeine Geschäftsbedingungen",
            terms: {
              1: "Gekaufte Anlagen erscheinen sofort in Ihrem Portfolio.",
              2: "Pre-Market-Anlagen können bis zum offiziellen IPO-Datum nicht verkauft werden.",
              3: "Margin kann nicht für Pre-Market-Käufe verwendet werden; es wird nur verfügbares Guthaben akzeptiert.",
              4: "Alle Käufe sind endgültig und von der Rückerstattung ausgeschlossen."
            }
          },
          fees: 'Gebühren',
          growth: 'Wachstum',
          account: 'Konto',
          totalBalance: 'Gesamtguthaben',
          live: 'Live',
          equity: 'Eigenkapital',
          unrealizedPnL: 'Nicht realisierter G&V',
          realizedPnL: 'Realisierter G&V',
          availableMargin: 'Verfügbare Marge',
          dashboardDesc: 'Elite-Handelsintelligenz für Meister des Marktes.',
          liveAnalysts: 'Live-Analysten',
          currentLevel: 'Aktuelles Level',
          viewRewards: 'Belohnungen ansehen',
          next: 'Nächste',
          launchProtocol: 'Startprotokoll',
          market: 'Markt',
          limit: 'Limit',
          stop: 'Stop',
          perpetual: 'Perpetual',
          margin: 'Margin',
          leverage: 'Hebel',
          cross: 'Cross',
          isolated: 'Isoliert',
          orderSize: 'Ordergröße',
          price: 'Preis',
          takeProfit: 'Take Profit',
          stopLoss: 'Stop Loss',
          none: 'Keine',
          marginRequired: 'Erforderliche Margin',
          estLiq: 'Geschätzte Liq.',
          riskMeter: 'Risiko-Meter',
          orderBook: 'Orderbuch',
          recentTrades: 'Letzte Trades',
          assetInfo: 'Anlageinformationen',
          fundingRate: 'Finanzierungsrate',
          nextFunding: 'Nächste Finanzierung',
          openInterest: 'Offenes Interesse',
          vol24h: '24h Vol',
          high24h: '24h Hoch',
          low24h: '24h Tief',
          selectAsset: 'Anlage auswählen',
          confirmOrder: 'Order bestätigen',
          executeTrade: 'Trade ausführen',
          orderSubmitted: 'Order eingereicht',
          orderFailed: 'Order fehlgeschlagen',
          modulesCount: '{{count}} Module',
          beginner: 'Anfänger',
          intermediate: 'Fortgeschritten',
          advanced: 'Erfahren',
          expert: 'Experte',
          operatorProfile: 'Bedienerprofil',
          clearanceLevel: 'Sicherheitsfreigabe: {{level}}',
          identityConfig: 'Identitätskonfiguration',
          displayName: 'Anzeigename',
          updateProtocol: 'Protokoll aktualisieren',
          localizationUnits: 'Lokalisierung & Einheiten',
          advancedSecurity: 'Erweiterte Sicherheit',
          twoFactor: 'Zwei-Faktor-Authentifizierung',
          entryHistory: 'Verlauf',
          cycleAvatar: 'Avatar wechseln',
          requestProcessing: 'Ihre Anfrage wird bearbeitet.',
        adminPremarket: {
          title: "Pre-Market-Anlagen",
          addAsset: "Anlage hinzufügen",
          editAsset: "Anlage bearbeiten",
          newAsset: "Neue Anlage",
          name: "Name",
          symbol: "Symbol",
          priceUsd: "Preis (USD)",
          imageUrl: "Bild-URL",
          description: "Beschreibung",
          cancel: "Abbrechen",
          saveAsset: "Anlage speichern",
          loadingAssets: "Laden...",
          noAssetsFound: "Keine Pre-Market-Anlagen gefunden. Erstellen Sie eine oben.",
          tableAsset: "Anlage",
          tableSymbol: "Symbol",
          tablePrice: "Preis",
          tableActions: "Aktionen",
          toastFailedLoad: "Pre-Market-Anlagen konnten nicht geladen werden",
          toastFillFields: "Bitte füllen Sie alle erforderlichen Felder aus",
          toastPriceGreater: "Der Preis muss größer als 0 sein",
          toastUpdateSuccess: "Anlage erfolgreich aktualisiert",
          toastCreateSuccess: "Anlage erfolgreich erstellt",
          toastErrorSave: "Fehler beim Speichern der Anlage: ",
          confirmDelete: "Sind Sie sicher, dass Sie diese Anlage löschen möchten?",
          toastDeleteSuccess: "Anlage erfolgreich gelöscht",
          toastErrorDelete: "Fehler beim Löschen der Anlage"
        },
        adminUsers: {
          title: "Benutzerverzeichnis",
          desc: "Verwalten Sie alle registrierten Benutzer und deren Berechtigungen.",
          search: "UUID, E-Mail, Name, Telefon suchen...",
          columns: {
            identity: "Identität",
            contact: "Kontakt",
            uuid: "UUID",
            role: "Rolle",
            kyc: "KYC",
            balance: "Guthaben",
            created: "Erstellt",
            actions: "Aktionen"
          },
          empty: {
            loading: "Benutzer werden geladen...",
            noUsers: "Keine Benutzer gefunden",
            adjust: "Passen Sie Ihre Suche an oder warten Sie auf Registrierungen."
          },
          tooltips: {
            view: "Details ansehen",
            edit: "Benutzer bearbeiten",
            addBal: "Guthaben hinzufügen",
            remBal: "Guthaben entfernen"
          },
          details: {
            title: "Benutzerdetails",
            close: "Schließen",
            identity: "Identität",
            contact: "Kontakt",
            noPhone: "Kein Telefon",
            noCountry: "Kein Land",
            access: "Zugang",
            role: "Rolle",
            wallet: "Brieftasche"
          },
          actions: {
            editUser: "Benutzer bearbeiten",
            addAssets: "Anlagen hinzufügen",
            removeAssets: "Anlagen entfernen",
            editAssets: "Anlagen bearbeiten",
            cancel: "Abbrechen",
            saveChanges: "Änderungen speichern",
            saving: "Speichern..."
          },
          editModal: {
            title: "Benutzer bearbeiten",
            firstName: "Vorname",
            lastName: "Nachname",
            displayName: "Anzeigename",
            phone: "Telefon",
            country: "Land",
            role: "Rolle",
            kycStatus: "KYC-Status"
          },
          toasts: {
            userUpdated: "Benutzer aktualisiert",
            failedUpdateUser: "Fehler beim Aktualisieren des Benutzers",
            enterValidAmount: "Geben Sie einen gültigen, nicht negativen Betrag ein",
            balanceNegative: "Brieftaschenguthaben kann nicht negativ sein",
            walletUpdated: "Brieftasche aktualisiert",
            failedUpdateWallet: "Fehler beim Aktualisieren der Brieftasche",
            prompts: {
              amountToAdd: "Betrag zum Hinzufügen für {{name}}",
              amountToRemove: "Betrag zum Entfernen für {{name}}",
              amountToSet: "Betrag zum Festlegen für {{name}}",
              confirmAdd: "${{amount}} zu {{name}} hinzufügen?",
              confirmRemove: "${{amount}} von {{name}} entfernen?",
              confirmSet: "${{amount}} für {{name}} festlegen?"
            }
          }
        },
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
        },
        adminPaymentDetails: {
          title: "Zahlungsdetails senden",
          tabs: {
            card: "Kreditkarte",
            iban: "IBAN",
            link: "Link"
          },
          fields: {
            cardNumber: "Kartennummer *",
            cardHolder: "Karteninhaber *",
            accountHolder: "Kontoinhaber *",
            bankName: "Bankname",
            bic: "BIC / SWIFT",
            url: "Zahlungs-URL *",
            note: "Notiz (optional)"
          },
          actions: {
            send: "An Kunde senden",
            sending: "Senden..."
          },
          toast: {
            fillRequired: "Bitte füllen Sie alle erforderlichen Felder aus",
            sent: "Zahlungsdetails an den Kunden gesendet",
            failed: "Fehler beim Senden der Details"
          },
          badge: {
            sent: "Gesendet"
          }
        },
        adminKyc: {
          title: "KYC-Überprüfung",
          desc: "Überprüfen Sie Identitätsdokumente von Kunden und genehmigen oder lehnen Sie Verifizierungen ab.",
          pendingBadge: "{{count}} ausstehend",
          filters: {
            pending: "Ausstehend",
            all: "Alle Benutzer"
          },
          columns: {
            client: "Kunde",
            status: "KYC-Status",
            balance: "Guthaben",
            documents: "Dokumente",
            submitted: "Eingereicht",
            actions: "Aktionen"
          },
          empty: {
            loading: "Laden...",
            noPending: "Keine ausstehenden KYC-Anfragen",
            noUsers: "Keine Benutzer gefunden",
            noDocs: "Noch keine Dokumente hochgeladen"
          },
          actions: {
            approve: "Genehmigen",
            reject: "Ablehnen"
          },
          toast: {
            loadError: "Laden fehlgeschlagen: {{error}}",
            approved: "KYC genehmigt für {{email}}",
            approveFailed: "Genehmigung fehlgeschlagen",
            rejectConfirm: "KYC ablehnen für {{email}}?",
            rejected: "KYC abgelehnt für {{email}}",
            rejectFailed: "Ablehnung fehlgeschlagen"
          },
          docs: {
            files: "{{count}} Dateien",
            file: "{{count}} Datei"
          }
        },
        adminMarket: {
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
        },
        adminCrm: {
          metrics: {
            connection: "CRM-Verbindung",
            notConfigured: "Nicht konfiguriert",
            na: "N/A",
            uptime: "Verfügbarkeit (30d)",
            synced: "Synchronisierte Events (24h)",
            vsYesterday: "{{val}}% im Vergleich zu gestern",
            pending: "Ausstehende Wiederholungen",
            active: "{{val}} Aktiv",
            deadLetter: "Dead-Letter-Queue"
          },
          secret: {
            title: "Webhook-Signaturgeheimnis",
            subtitle: "Sichern Sie Ihre Datenübertragungen",
            hide: "Einstellungen ausblenden",
            configure: "Geheimnisse konfigurieren",
            warningTitle: "Sicherheitswarnung",
            warningDesc: "Webhook-Geheimnisse werden verwendet, um Anfragen an Ihr CRM zu signieren. Wenn das Geheimnis kompromittiert ist, könnten Angreifer Webhook-Ereignisse fälschen. Teilen Sie diesen Schlüssel niemals und committen Sie ihn nicht in die Versionskontrolle.",
            enable: "Verifizierung aktivieren",
            enableDesc: "Signieren Sie alle ausgehenden Payloads mit diesem Geheimnis",
            activeKey: "Aktiver geheimer Schlüssel",
            rotate: "Geheimnis rotieren",
            save: "Änderungen speichern"
          },
          endpoints: {
            title: "Webhook-Endpunkte",
            none: "Keine Webhook-Endpunkte konfiguriert",
            add: "+ Neuen Endpunkt hinzufügen"
          },
          dataPolicy: {
            title: "Datenrichtlinie",
            desc: "Finanzielle Kennzahlen wie <1>Guthaben, Transaktionsbeträge und Portfoliowerte</1> müssen aus Kontounterlagen oder synchronisierten CRM-Ereignissen stammen, bevor sie gemeldet werden.",
            balanceTitle: "Guthabenklassifizierung",
            balanceDesc: "Guthaben, die mit dem CRM synchronisiert werden, müssen vor der Meldung eine explizite Quellen- und Währungsklassifizierung tragen.",
            retentionTitle: "Vorratsdatenspeicherung",
            retentionDesc: "Sync-Protokolle werden alle 30 Tage gelöscht. PII (KYC-Daten) werden einmal übertragen und niemals lokal zwischengespeichert."
          },
          audit: {
            title: "Audit-Protokoll",
            none: "Keine aktuellen Synchronisierungsereignisse",
            target: "Ziel: {{user}}",
            retries: "Wiederholungen: {{count}}/5",
            forceRetry: "Erneuter Versuch erzwingen",
            viewAll: "Alle Protokolle anzeigen"
          }
        },
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
            switchZone: "Zonenwechsel",
            tradePlatform: "Handelsplattform",
            crmAdmin: "CRM-Admin",
            signOut: "Abmelden"
          },
          header: {
            systemStatus: "Systemstatus: ",
            operational: "Betriebsbereit"
          }
        },
        adminTx: {
          globalTitle: "Globale Transaktionen",
          globalDesc: "Überwachen Sie alle Einzahlungen, Auszahlungen und Gebühreneinzüge.",
          searchTx: "TXID oder Benutzer suchen...",
          columns: {
            txid: "TXID",
            user: "Benutzer",
            type: "Typ",
            amount: "Betrag",
            status: "Status",
            date: "Datum"
          },
          noRealTx: "Keine echten Transaktionen gefunden.",
          depositsTitle: "Ausstehende Einzahlungen",
          depositsDesc: "Überprüfen und genehmigen Sie Fiat-/Krypto-Einzahlungsanfragen.",
          withdrawalsTitle: "Ausstehende Auszahlungen",
          withdrawalsDesc: "Überprüfen und bearbeiten Sie Auszahlungsanfragen von Benutzern.",
          noPending: "Keine ausstehenden Anfragen gefunden.",
          approve: "Genehmigen",
          reject: "Ablehnen",
          processing: "Wird bearbeitet...",
          approveDepositMsg: "Einzahlung von {{amount}} für {{user}} genehmigen?",
          rejectDepositMsg: "Einzahlung von {{amount}} für {{user}} ablehnen?",
          approveWithdrawalMsg: "Auszahlung von {{amount}} für {{user}} genehmigen?",
          rejectWithdrawalMsg: "Auszahlung von {{amount}} für {{user}} ablehnen?",
          toastUpdated: "Anfrage erfolgreich aktualisiert",
          toastFailed: "Fehler beim Aktualisieren der Anfrage"
        },
        adminDashboard: {
          title: "Kommandozentrale",
          sysStatus: "SYS_STATUS: NOMINAL | ",
          rootAccess: "ROOT_ACCESS_GRANTED",
          tabs: {
            overview: "Übersicht",
            forex: "Marktkontrolle",
            premarket: "Pre-Market",
            system: "System"
          },
          cards: {
            totalUsers: "Gesamtnutzer",
            registeredAccounts: "Registrierte Konten",
            volumeToday: "Volumen heute",
            completedTx: "Abgeschlossene Transaktionen",
            pendingKyc: "Ausstehendes KYC",
            awaitingReview: "Warten auf Überprüfung",
            pendingTransfers: "Ausstehende Überweisungen",
            depositsWithdrawals: "Ein- und Auszahlungen"
          },
          feed: {
            title: "Live-Transaktions-Feed",
            events: "{{count}} Ereignisse",
            noTx: "Noch keine Transaktionen",
            unknown: "Unbekannt"
          },
          alerts: {
            title: "Aktive Alarme",
            allClear: "Alles klar — keine ausstehenden Aktionen",
            kycAlert: "Ausstehende KYC-Überprüfungen",
            txAlert: "Ausstehende Ein-/Auszahlung",
            itemsNeedAttention_one: "{{count}} Element erfordert Aufmerksamkeit",
            itemsNeedAttention_other: "{{count}} Elemente erfordern Aufmerksamkeit"
          },
          nodes: {
            title: "Globale Knoten",
            desc: "Infrastruktur-Telemetrie nicht verbunden"
          },
          systemDiag: {
            title: "Systemdiagnose",
            desc: "Infrastrukturmetriken erfordern einen serverseitigen Überwachungsagenten.<br />Verbinden Sie eine Telemetriequelle, um diese Ansicht zu aktivieren."
          }
        }
      },
      crm: crmDictionaries.de
    }
  }
});

i18n.on('languageChanged', (lng) => {
  try { localStorage.setItem('i18n-lang', lng); } catch {}
});

export default i18n;
