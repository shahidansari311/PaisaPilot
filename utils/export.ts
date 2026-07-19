import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { SQLiteDatabase } from 'expo-sqlite';
import { Transaction } from '../types/database';

export const exportTransactionsCSV = async (db: SQLiteDatabase, monthPrefix?: string) => {
  try {
    const query = monthPrefix
      ? `SELECT * FROM transactions WHERE strftime('%Y-%m', date) = ? ORDER BY date ASC, createdAt ASC`
      : `SELECT * FROM transactions ORDER BY date ASC, createdAt ASC`;
    const params = monthPrefix ? [monthPrefix] : [];
    const transactions = await db.getAllAsync<Transaction>(query, params);
    
    // Fetch budget summary
    const currentMonth = monthPrefix || new Date().toISOString().substring(0, 7);
    const budgetRow = await db.getFirstAsync<{ amount: number }>(`SELECT amount FROM budgets WHERE period = 'monthly' AND month = ? LIMIT 1`, [currentMonth]);
    const budgetAmount = budgetRow?.amount || 0;
    const expRow = await db.getFirstAsync<{ total: number }>(`SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND strftime('%Y-%m', date) = ?`, [currentMonth]);
    const totalUsed = expRow?.total || 0;
    const remaining = budgetAmount > 0 ? budgetAmount - totalUsed : 0;

    let csvString = `PaisaPilot Statement\n`;
    if (budgetAmount > 0) {
      csvString += `Budget,${budgetAmount}\nUsed,${totalUsed}\nRemaining,${remaining}\n\n`;
    }
    
    // Create CSV header
    csvString += 'Date,Description,Category,Type,Amount (INR),Running Balance (INR)\n';
    
    let runningBalance = 0;

    // Add rows
    transactions.forEach(tx => {
      const isExp = tx.type === 'expense';
      runningBalance += isExp ? -tx.amount : tx.amount;
      
      const safeNote = tx.note ? `"${tx.note.replace(/"/g, '""')}"` : 'Transaction';
      const safeCategory = tx.categoryId || 'Uncategorized';
      const formattedDate = new Date(tx.date).toLocaleDateString('en-IN');
      const prefix = isExp ? '-' : '+';
      
      csvString += `${formattedDate},${safeNote},${safeCategory},${tx.type.toUpperCase()},${prefix}${tx.amount},${runningBalance}\n`;
    });

    const file = new File(Paths.document, 'PaisaPilot_Statement.csv');
    file.write(csvString);
    
    await shareFile(file.uri, 'text/csv');
  } catch (error) {
    console.error('CSV Export failed:', error);
    throw error;
  }
};

export const exportTransactionsPDF = async (db: SQLiteDatabase, monthPrefix?: string) => {
  try {
    const query = monthPrefix
      ? `SELECT * FROM transactions WHERE strftime('%Y-%m', date) = ? ORDER BY date DESC LIMIT 100`
      : `SELECT * FROM transactions ORDER BY date DESC LIMIT 100`;
    const params = monthPrefix ? [monthPrefix] : [];
    const transactions = await db.getAllAsync<Transaction>(query, params);
    
    // Fetch budget summary
    const currentMonth = monthPrefix || new Date().toISOString().substring(0, 7);
    const budgetRow = await db.getFirstAsync<{ amount: number }>(`SELECT amount FROM budgets WHERE period = 'monthly' AND month = ? LIMIT 1`, [currentMonth]);
    const budgetAmount = budgetRow?.amount || 0;
    const expRow = await db.getFirstAsync<{ total: number }>(`SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND strftime('%Y-%m', date) = ?`, [currentMonth]);
    const totalUsed = expRow?.total || 0;
    const remaining = budgetAmount > 0 ? budgetAmount - totalUsed : 0;

    let rows = '';
    transactions.forEach(tx => {
      const isExpense = tx.type === 'expense';
      const color = isExpense ? '#f43f5e' : '#10b981';
      const prefix = isExpense ? '-' : '+';
      rows += `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${new Date(tx.date).toLocaleDateString()}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${tx.note || 'Transaction'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: ${color}; font-weight: bold;">${prefix}₹${tx.amount}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; padding: 40px; }
            h1 { color: #10b981; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; padding: 12px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <h1>PaisaPilot Report</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
          
          ${budgetAmount > 0 ? `
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; border: 1px solid #e2e8f0;">
            <div>
              <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: bold;">Budget</p>
              <h2 style="margin: 5px 0 0; color: #0f172a;">₹${budgetAmount.toLocaleString('en-IN')}</h2>
            </div>
            <div>
              <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: bold;">Used</p>
              <h2 style="margin: 5px 0 0; color: #f43f5e;">₹${totalUsed.toLocaleString('en-IN')}</h2>
            </div>
            <div>
              <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: bold;">Remaining</p>
              <h2 style="margin: 5px 0 0; color: ${remaining >= 0 ? '#10b981' : '#f43f5e'};">₹${remaining.toLocaleString('en-IN')}</h2>
            </div>
          </div>
          ` : ''}

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <p style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center;">Powered by PaisaPilot</p>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await shareFile(uri, 'application/pdf');
  } catch (error) {
    console.error('PDF Export failed:', error);
    throw error;
  }
};

export const exportSplitGroupPDF = async (db: SQLiteDatabase, groupId: string) => {
  try {
    const group = await db.getFirstAsync<{name: string}>('SELECT name FROM split_groups WHERE id = ?', [groupId]);
    if (!group) throw new Error('Group not found');

    const participants = await db.getAllAsync<{id: string, name: string}>('SELECT * FROM split_participants WHERE groupId = ?', [groupId]);
    const expenses = await db.getAllAsync<{id: string, paidBy: string, totalAmount: number, description: string, createdAt: string}>('SELECT * FROM split_expenses WHERE groupId = ? ORDER BY createdAt DESC', [groupId]);

    // Calculate Settlements
    const balances: Record<string, number> = {};
    participants.forEach(p => balances[p.id] = 0);

    let expenseDetailsHTML = '';

    for (const exp of expenses) {
      if (balances[exp.paidBy] !== undefined) {
        balances[exp.paidBy] += exp.totalAmount;
      }
      const shares = await db.getAllAsync<{participantId: string, owedAmount: number}>('SELECT * FROM split_shares WHERE expenseId = ?', [exp.id]);
      
      const payerName = participants.find(p => p.id === exp.paidBy)?.name || 'Unknown';
      const includedNames = shares.map(s => participants.find(p => p.id === s.participantId)?.name || 'Unknown').join(', ');
      
      expenseDetailsHTML += `
        <div style="border-bottom: 1px solid #e2e8f0; padding: 12px 0;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <h3 style="margin: 0 0 4px 0; color: #0f172a;">${exp.description}</h3>
            <h3 style="margin: 0; color: #8b5cf6;">₹${exp.totalAmount}</h3>
          </div>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;">Paid by <strong>${payerName}</strong></p>
          <p style="margin: 0; font-size: 13px; color: #64748b;">Split between: ${includedNames}</p>
        </div>
      `;

      for (const share of shares) {
        if (balances[share.participantId] !== undefined) {
          balances[share.participantId] -= share.owedAmount;
        }
      }
    }

    const debtors = Object.keys(balances).filter(k => balances[k] < -0.01).map(k => ({ id: k, amount: -balances[k] })).sort((a,b) => b.amount - a.amount);
    const creditors = Object.keys(balances).filter(k => balances[k] > 0.01).map(k => ({ id: k, amount: balances[k] })).sort((a,b) => b.amount - a.amount);
    
    let settlementsHTML = '';
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const settleAmount = Math.min(debtors[i].amount, creditors[j].amount);
      const fromName = participants.find(p => p.id === debtors[i].id)?.name || 'Unknown';
      const toName = participants.find(p => p.id === creditors[j].id)?.name || 'Unknown';
      
      settlementsHTML += `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
          <span style="color: #0f172a;"><strong>${fromName}</strong> owes <strong>${toName}</strong></span>
          <span style="color: #f43f5e; font-weight: bold;">₹${settleAmount.toFixed(2)}</span>
        </div>
      `;
      
      debtors[i].amount -= settleAmount;
      creditors[j].amount -= settleAmount;
      
      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }

    if (!settlementsHTML) settlementsHTML = '<p style="color: #64748b;">All settled up! 🎉</p>';
    if (!expenseDetailsHTML) expenseDetailsHTML = '<p style="color: #64748b;">No expenses recorded yet.</p>';

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; padding: 40px; }
            h1 { color: #8b5cf6; margin-bottom: 5px; }
            .section { margin-top: 30px; }
            h2 { font-size: 18px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <h1>${group.name} - Split Report</h1>
          <p style="color: #64748b; margin-top: 0;">Generated on ${new Date().toLocaleString()}</p>
          
          <div class="section">
            <h2>Settlements (Who owes who)</h2>
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
              ${settlementsHTML}
            </div>
          </div>

          <div class="section">
            <h2>Expense Breakdown</h2>
            ${expenseDetailsHTML}
          </div>
          
          <p style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center;">Powered by PaisaPilot Split Expenses</p>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await shareFile(uri, 'application/pdf');
  } catch (error) {
    console.error('Group PDF Export failed:', error);
    throw error;
  }
};

const shareFile = async (uri: string, mimeType: string) => {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { UTI: mimeType, mimeType });
  } else {
    console.warn('Sharing is not available on this platform');
  }
};
