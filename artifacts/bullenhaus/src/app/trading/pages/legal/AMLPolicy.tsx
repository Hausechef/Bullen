import React from 'react';
import { LegalLayout } from './LegalLayout';

const sections = [
  {
    heading: 'Policy Statement',
    body: (
      <p>Bullenhaus GmbH is committed to the prevention of money laundering, terrorist financing, and other financial crimes. This AML & Compliance Policy establishes the framework by which Bullenhaus identifies, assesses, manages, and mitigates financial crime risks in accordance with EU Directive 2018/843 (5th AMLD), EU Directive 2018/1673 (6th AMLD), and applicable national law.</p>
    ),
  },
  {
    heading: 'Know Your Customer (KYC)',
    body: (
      <>
        <p>All clients must complete a mandatory KYC process before accessing trading and withdrawal services. This includes:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Government-issued photo identity document (passport, national ID, or driver's licence).</li>
          <li>Proof of residential address dated within the last 3 months (utility bill, bank statement).</li>
          <li>Source of funds declaration for deposits exceeding applicable thresholds.</li>
          <li>Enhanced due diligence (EDD) documentation for Politically Exposed Persons (PEPs) or high-risk clients.</li>
        </ul>
      </>
    ),
  },
  {
    heading: 'Customer Due Diligence (CDD)',
    body: (
      <>
        <p>We apply risk-based Customer Due Diligence measures categorised as:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><strong className="text-white">Standard CDD:</strong> Applied to all clients on onboarding and reviewed periodically.</li>
          <li><strong className="text-white">Simplified CDD:</strong> May apply to lower-risk customers as defined by our risk assessment framework.</li>
          <li><strong className="text-white">Enhanced CDD (EDD):</strong> Mandatory for high-risk customers, PEPs, and clients from high-risk jurisdictions as designated by the FATF.</li>
        </ul>
      </>
    ),
  },
  {
    heading: 'Transaction Monitoring',
    body: (
      <p>Bullenhaus employs automated and manual transaction monitoring systems to detect unusual or suspicious activity, including structuring (smurfing), rapid movement of large sums, deposits from unrelated third parties, and activity inconsistent with a client's stated profile and risk appetite. Alerts are reviewed by our compliance team and escalated where necessary.</p>
    ),
  },
  {
    heading: 'Suspicious Activity Reporting (SAR)',
    body: (
      <p>Where Bullenhaus has knowledge or reasonable grounds to suspect that a transaction or activity is related to money laundering or terrorist financing, we are legally obligated to file a Suspicious Activity Report (SAR) with the relevant Financial Intelligence Unit (FIU). Tipping off a subject of investigation is a criminal offence and is strictly prohibited.</p>
    ),
  },
  {
    heading: 'Sanctions Screening',
    body: (
      <p>All clients and transactions are screened against applicable sanctions lists, including EU, UN, OFAC (US), and HMT (UK) lists. Bullenhaus will not knowingly engage in transactions with sanctioned individuals, entities, or jurisdictions. Matches are escalated immediately to the compliance team and, where required, reported to authorities.</p>
    ),
  },
  {
    heading: 'Politically Exposed Persons (PEPs)',
    body: (
      <p>Bullenhaus applies Enhanced Due Diligence to all clients identified as PEPs, their family members, and close associates. Accounts for PEPs require senior management approval and are subject to enhanced ongoing monitoring. PEP status is reviewed on an ongoing basis.</p>
    ),
  },
  {
    heading: 'Record-Keeping',
    body: (
      <p>We maintain comprehensive records of all client identification documents, transaction records, CDD assessments, and internal compliance reports for a minimum of 5 years after the end of the business relationship, or longer where required by applicable law.</p>
    ),
  },
  {
    heading: 'Staff Training',
    body: (
      <p>All Bullenhaus employees receive mandatory AML/CFT training upon onboarding and on an annual basis thereafter. Training covers recognition of red flags, internal reporting procedures, legal obligations, and updates to regulatory requirements.</p>
    ),
  },
  {
    heading: 'Reporting & Contact',
    body: (
      <p>To report AML concerns or submit compliance-related inquiries, contact our dedicated AML team at <a href="mailto:aml@bullenhaus.com" className="text-yellow-400 hover:underline">aml@bullenhaus.com</a>. Internal staff must report suspected money laundering to the Nominated Officer (MLRO) using the secure internal reporting channel.</p>
    ),
  },
];

export const AMLPolicy: React.FC = () => (
  <LegalLayout
    title="AML & Compliance Policy"
    subtitle="Bullenhaus is committed to the prevention of financial crime. This policy outlines our anti-money laundering framework, KYC requirements, and compliance obligations under applicable EU regulations."
    lastUpdated="January 2025"
    sections={sections}
  />
);
