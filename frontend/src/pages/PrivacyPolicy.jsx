import React from 'react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import { ShieldCheck, Lock, FileText, Database, UserCheck } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Privacy Policy"
        subtitle="Data governance, audit persistence, and customer information handling policies."
      />

      <Card className="p-6 sm:p-8 space-y-6 text-slate-300 text-sm leading-relaxed">
        <div className="border-b border-navy-800 pb-4">
          <p className="text-xs font-mono text-slate-400">Effective Date: October 1, 2026 | Platform Version: 1.0.0</p>
          <p className="text-xs font-mono text-cyanAccent mt-1">Domain: app.churnlens.io</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Database className="h-4 w-4 text-cyanAccent" />
            1. Scope and Covered Data
          </h2>
          <p>
            ChurnLens processes customer telemetry and billing data solely to generate churn risk probabilities, 
            local TreeSHAP attribution scores, and counterfactual simulation results. The data fields processed 
            include subscription tenure, contract terms, monthly and total charges, payment channels, and service add-ons.
          </p>
          <p>
            The platform does not ingest personally identifiable information such as government tax identifiers, 
            payment card numbers, or passwords.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Lock className="h-4 w-4 text-cyanAccent" />
            2. Local Processing and Model Isolation
          </h2>
          <p>
            Inference calculations are executed entirely on your designated server or container cluster. Customer records 
            are not shared with third-party advertising networks or external language model providers. All batch scoring 
            and real-time prediction pipelines operate in a zero-leakage runtime environment.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyanAccent" />
            3. Audit Logging and Database Storage
          </h2>
          <p>
            To support post-deployment drift monitoring and model validation, prediction outputs are logged to 
            the local relational database table (prediction_audit_logs). Stored fields comprise:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs font-mono text-slate-400 pl-2">
            <li>Unique execution identifier (UUID)</li>
            <li>Timestamp of inference request</li>
            <li>Model version identifier (e.g. Pipeline v1.0.0)</li>
            <li>Applied decision threshold and calculated risk tier</li>
            <li>Raw feature vector for population stability analysis</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-cyanAccent" />
            4. Data Retention and Erasure
          </h2>
          <p>
            Audit logs and batch upload records remain under the strict control of the hosting organization. 
            System administrators can purge batch outputs or database audit records at any time using standard 
            SQL commands or container volume resets.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyanAccent" />
            5. Governance Contact
          </h2>
          <p>
            For inquiries regarding data protection policies or enterprise on-premise installation standards, 
            contact the compliance desk at <span className="font-mono text-cyanAccent">compliance@churnlens.io</span>.
          </p>
        </section>
      </Card>
    </div>
  );
}
