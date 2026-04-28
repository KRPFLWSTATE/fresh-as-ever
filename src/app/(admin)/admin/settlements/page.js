'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

import styles from './page.module.css';

export default function AdminSettlements() {
  const supabase = createClient();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSettlements = useCallback(async () => {
    const { data } = await supabase.from('settlements').select('*, merchant:merchant_id(business_name, payout_method, bank_details)').order('period_end', { ascending: false });
    setSettlements(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadSettlements(); }, [loadSettlements]);

  const handleExportCSV = () => {
    if (settlements.length === 0) return;
    const header = "Internal ID,Status,Amount,Merchant,Payout Method,Bank Name,Account Name,Account No,Branch,Period Start,Period End\n";
    const csv = settlements.map(s => {
      const b = s.merchant?.bank_details || {};
      return `${s.id},${s.status},${s.amount},"${s.merchant?.business_name}",${s.merchant?.payout_method},"${b.bank_name || ''}","${b.account_name || ''}","${b.account_number || ''}","${b.branch || ''}",${s.period_start},${s.period_end}`;
    }).join('\n');
    
    const blob = new Blob([header + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `settlements_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Settlements</h1>
        <button className={styles.exportBtn} onClick={handleExportCSV}>Export CSV</button>
      </header>

      {loading ? (
        <div className={styles.loadingState}>Loading...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Period</th>
                <th>Merchant</th>
                <th>Amount (Rs.)</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map(s => (
                <tr key={s.id}>
                  <td className={styles.itemMeta}>{new Date(s.period_start).toLocaleDateString()} - {new Date(s.period_end).toLocaleDateString()}</td>
                  <td className={styles.itemPrimary}>{s.merchant?.business_name}</td>
                  <td className={styles.itemPrimary}>{Number(s.amount).toLocaleString()}</td>
                  <td className={styles.refCode}>{s.merchant?.payout_method.replace('_', ' ').toUpperCase()}</td>
                  <td><span className={`badge ${s.status === 'paid' ? 'badge-teal' : 'badge-amber'}`}>{s.status}</span></td>
                </tr>
              ))}
              {settlements.length === 0 && <tr><td colSpan="5" className={styles.emptyState}>No settlements generated yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
