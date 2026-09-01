import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { SPACING } from '../../constants/theme';
import { Transaction } from '../../types/database';
import { TransactionItem } from '../transactions/TransactionItem';

interface DashboardRecentListProps {
  recentTransactions: Transaction[];
  theme: any;
}

export function DashboardRecentList({ recentTransactions, theme }: DashboardRecentListProps) {
  return (
    <View style={{ marginHorizontal: SPACING.xl }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: SPACING.md }}>
        <Typography variant="title">Recent</Typography>
        <TouchableOpacity onPress={() => router.navigate('/(tabs)/transactions' as any)} activeOpacity={0.7}>
          <Typography variant="body" color="primary" weight="bold">View All</Typography>
        </TouchableOpacity>
      </View>

      {recentTransactions.length === 0 ? (
        <Card variant="outlined" padding="xxl" style={{ alignItems: 'center', borderStyle: 'dashed' }}>
          <Typography variant="headline" style={{ marginBottom: SPACING.sm }}>📝</Typography>
          <Typography variant="bodyLarge" weight="bold" style={{ marginBottom: SPACING.xs }}>No transactions yet</Typography>
          <Typography variant="body" color="muted" align="center">
            Tap "Expense" or "Income" to record your first transaction.
          </Typography>
        </Card>
      ) : (
        <Card variant="flat" padding="md">
          {recentTransactions.map((tx, i) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              isLast={i === recentTransactions.length - 1}
            />
          ))}
        </Card>
      )}
    </View>
  );
}
