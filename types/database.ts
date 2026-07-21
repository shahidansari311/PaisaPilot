export interface Account {
  id: string;
  name: string;
  type: 'Cash' | 'Bank' | 'Wallet' | 'Credit Card' | 'UPI';
  balance: number;
  personName?: string;
  personPhone?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  date: string;
  note?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId?: string;
  amount: number;
  period: 'monthly' | 'weekly';
  createdAt: string;
}

export interface BorrowRecord {
  id: string;
  person: string;
  phone?: string;
  amount: number;
  dueDate: string;
  notes?: string;
  status: 'pending' | 'settled';
  createdAt: string;
}

export interface LendRecord {
  id: string;
  person: string;
  phone?: string;
  amount: number;
  dueDate: string;
  notes?: string;
  status: 'pending' | 'settled';
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  isRecurring: boolean;
  createdAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  createdAt: string;
}

export interface SplitGroup {
  id: string;
  name: string;
  createdAt: string;
}

export interface SplitParticipant {
  id: string;
  groupId: string;
  name: string;
}

export interface SplitExpense {
  id: string;
  groupId: string;
  paidBy: string; // participantId
  totalAmount: number;
  description: string;
  createdAt: string;
}

export interface SplitShare {
  expenseId: string;
  participantId: string;
  owedAmount: number;
}

export interface RoommateLedger {
  id: string;
  name: string;
  createdAt: string;
}

export interface RoommateEntry {
  id: string;
  ledgerId: string;
  paidBy: 'me' | 'roommate';
  amount: number;
  description: string;
  date: string;
  isPaid: number; // 0 = pending, 1 = settled
  createdAt: string;
}
