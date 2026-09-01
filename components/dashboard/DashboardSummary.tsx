import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Minus, Plus, TrendingDown, Wallet, Repeat, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SPACING, RADIUS } from '../../constants/theme';

interface DashboardSummaryProps {
  totalBalance: number;
  expense: number;
  budgetAmount: number;
  remaining: number;
  isOverBudget: boolean;
  progressColor: string;
  pct: number;
  totalBorrowed: number;
  totalLent: number;
  theme: any;
}

export function DashboardSummary({
  totalBalance, expense, budgetAmount, remaining, isOverBudget,
  progressColor, pct, totalBorrowed, totalLent, theme
}: DashboardSummaryProps) {
  return (
    <View style={{ paddingHorizontal: SPACING.xl, marginBottom: SPACING.xxl }}>
      <Typography variant="body" color="muted" style={{ marginBottom: SPACING.sm }}>
        Net Flow (This Month)
      </Typography>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg }}>
        <Typography variant="display" mono color={totalBalance >= 0 ? 'text' : 'danger'}>
          {totalBalance < 0 ? '−' : ''}₹{Math.abs(totalBalance).toLocaleString('en-IN')}
        </Typography>
      </View>

      <View style={{ flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg }}>
        <Button
          variant="primary"
          style={{ flex: 1 }}
          icon={<Minus size={18} color={theme.colors.white} strokeWidth={2.5} />}
          onPress={() => router.push({ pathname: '/add-transaction', params: { prefillType: 'expense' } } as any)}
        >
          Expense
        </Button>
        <Button
          variant="secondary"
          style={{ flex: 1 }}
          icon={<Plus size={18} color={theme.colors.primary} strokeWidth={2.5} />}
          onPress={() => router.push({ pathname: '/add-transaction', params: { prefillType: 'income' } } as any)}
        >
          Income
        </Button>
      </View>

      <View style={{ gap: SPACING.lg }}>
        <View style={{ flexDirection: 'row', gap: SPACING.md }}>
          <Card variant="flat" padding="lg" style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm }}>
              <View style={{ backgroundColor: theme.colors.dangerLight, padding: 4, borderRadius: RADIUS.sm }}>
                <TrendingDown size={14} color={theme.colors.danger} strokeWidth={2.5} />
              </View>
              <Typography variant="caption" color="muted">SPENT</Typography>
            </View>
            <Typography variant="title" mono color="text">₹{expense.toLocaleString('en-IN')}</Typography>
          </Card>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.navigate('/budget' as any)}
            style={{ flex: 1 }}
          >
            <Card variant="flat" padding="lg" style={{ height: '100%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm }}>
                <View style={{ backgroundColor: theme.colors.successLight, padding: 4, borderRadius: RADIUS.sm }}>
                  <Wallet size={14} color={theme.colors.success} strokeWidth={2.5} />
                </View>
                <Typography variant="caption" color="muted">BUDGET</Typography>
              </View>
              {budgetAmount > 0 ? (
                <>
                  <Typography variant="title" mono color={isOverBudget ? 'danger' : 'text'}>
                    {isOverBudget ? 'Over' : `₹${Math.abs(remaining).toLocaleString('en-IN')}`}
                  </Typography>
                  <View style={{ height: 4, backgroundColor: theme.colors.surface, borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
                    <View style={{ height: 4, backgroundColor: progressColor, width: `${Math.min(100, pct * 100)}%` }} />
                  </View>
                </>
              ) : (
                <Typography variant="body" color="muted" style={{ marginTop: 2 }}>Not set</Typography>
              )}
            </Card>
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.7} onPress={() => router.navigate('/(tabs)/borrow-lend' as any)}>
          <Card variant="flat" padding="lg" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
              <View style={{ backgroundColor: theme.colors.warningLight, width: 40, height: 40, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' }}>
                <Repeat size={18} color={theme.colors.warning} strokeWidth={2.5} />
              </View>
              <View>
                <Typography variant="bodyLarge" weight="bold">Debt & Loans</Typography>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                  {totalBorrowed > 0 && <Typography variant="caption" color="danger">Owe ₹{totalBorrowed.toLocaleString('en-IN')}</Typography>}
                  {totalLent > 0 && <Typography variant="caption" color="success">Get ₹{totalLent.toLocaleString('en-IN')}</Typography>}
                  {totalBorrowed === 0 && totalLent === 0 && <Typography variant="caption" color="muted">All settled</Typography>}
                </View>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.textMuted} />
          </Card>
        </TouchableOpacity>
      </View>
    </View>
  );
}
