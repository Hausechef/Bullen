import React from 'react';
import { LegalLayout } from './LegalLayout';

const sections = [
  {
    heading: 'Corporate Identity',
    body: (
      <div className="bg-white/3 border border-white/5 rounded-xl p-5 space-y-3 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
          <div><span className="text-white font-semibold">Legal Name:</span><br />Bullenhaus GmbH</div>
          <div><span className="text-white font-semibold">Legal Form:</span><br />Gesellschaft mit beschränkter Haftung (GmbH)</div>
          <div><span className="text-white font-semibold">Registration Number:</span><br />HRB 000000 B</div>
          <div><span className="text-white font-semibold">Register Court:</span><br />Amtsgericht Berlin-Charlottenburg</div>
          <div><span className="text-white font-semibold">VAT Identification:</span><br />DE000000000</div>
          <div><span className="text-white font-semibold">Founded:</span><br />2021</div>
          <div><span className="text-white font-semibold">Registered Address:</span><br />Unter den Linden 1, 10117 Berlin, Germany</div>
          <div><span className="text-white font-semibold">Operating Jurisdiction:</span><br />Federal Republic of Germany</div>
        </div>
      </div>
    ),
  },
  {
    heading: 'Management & Governance',
    body: (
      <>
        <p>Bullenhaus GmbH is governed by its Managing Directors (Geschäftsführer) who are jointly responsible for the strategic direction, regulatory compliance, and financial integrity of the company. The Supervisory Board oversees the management and represents the interests of shareholders.</p>
        <p>All directors and key function holders are subject to fitness and propriety assessments in accordance with applicable regulatory requirements.</p>
      </>
    ),
  },
  {
    heading: 'Regulatory Authorization',
    body: (
      <>
        <p>Bullenhaus holds the necessary authorizations to provide investment and ancillary services as defined under MiFID II. Our regulatory status is maintained in good standing and subject to ongoing supervision by the competent authority.</p>
        <p>Clients are encouraged to verify our regulatory status through the official public register maintained by BaFin (Bundesanstalt für Finanzdienstleistungsaufsicht) at <a href="https://www.bafin.de" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">www.bafin.de</a>.</p>
      </>
    ),
  },
  {
    heading: 'Capital & Financial Strength',
    body: (
      <p>Bullenhaus maintains regulatory capital well in excess of minimum requirements as mandated by applicable capital adequacy rules. We publish periodic financial disclosures in accordance with our regulatory obligations. Client assets are held in segregated accounts, separate from company funds, in accordance with client asset protection rules.</p>
    ),
  },
  {
    heading: 'Group Structure',
    body: (
      <p>Bullenhaus GmbH operates as the primary regulated entity within the Bullenhaus Group. Details of any affiliated entities, parent companies, or subsidiaries are disclosed in our annual report and available upon request from our Compliance Department.</p>
    ),
  },
  {
    heading: 'Investor Compensation',
    body: (
      <p>Eligible clients of Bullenhaus may be entitled to compensation under the applicable Investor Compensation Scheme in the event of the firm's inability to meet its financial obligations. Details of coverage limits and eligibility criteria are available upon request or from the relevant national compensation scheme authority.</p>
    ),
  },
  {
    heading: 'Publication of Information',
    body: (
      <p>In accordance with our regulatory obligations, Bullenhaus publishes its Order Execution Policy, Conflicts of Interest Policy, and Best Execution reports. These documents are available upon request from <a href="mailto:compliance@bullenhaus.com" className="text-yellow-400 hover:underline">compliance@bullenhaus.com</a>.</p>
    ),
  },
  {
    heading: 'Contact for Corporate Matters',
    body: (
      <p>For corporate, legal, or institutional inquiries, please contact us at <a href="mailto:corporate@bullenhaus.com" className="text-yellow-400 hover:underline">corporate@bullenhaus.com</a> or by post at our registered address. Institutional onboarding and prime brokerage inquiries should be directed to <a href="mailto:institutional@bullenhaus.com" className="text-yellow-400 hover:underline">institutional@bullenhaus.com</a>.</p>
    ),
  },
];

export const CorporateData: React.FC = () => (
  <LegalLayout
    title="Corporate Data"
    subtitle="Official corporate registration details, regulatory authorizations, governance structure, and institutional contact information for Bullenhaus GmbH."
    lastUpdated="January 2025"
    sections={sections}
  />
);
