import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { useThemeStore } from '../../store/useThemeStore';
import { Colors } from '../../constants/Colors';
import { Transaction } from '../../types/database';

type TxWithCategory = Transaction & { categoryName?: string; categoryIcon?: string; categoryColor?: string; };

interface Props {
  transactions: TxWithCategory[];
}

export function ReportView({ transactions }: Props) {
  const isDark = useThemeStore((state) => state.isDark);
  const theme = isDark ? Colors.dark : Colors.light;
  
  const [reportType, setReportType] = useState<'expense' | 'income'>('expense');

  const filteredTx = transactions.filter(t => t.type === reportType);
  const total = filteredTx.reduce((sum, t) => sum + t.amount, 0);

  // Group by category
  const categoryTotals: Record<string, { amount: number; color: string; name: string }> = {};
  filteredTx.forEach(t => {
    const catName = t.categoryName || 'Other';
    const catColor = t.categoryColor || (reportType === 'expense' ? theme.danger : theme.success);
    if (!categoryTotals[catName]) {
      categoryTotals[catName] = { amount: 0, color: catColor, name: catName };
    }
    categoryTotals[catName].amount += t.amount;
  });

  const chartData = Object.values(categoryTotals).sort((a, b) => b.amount - a.amount);

  const radius = 80;
  const strokeWidth = 24; // Thinner for a cleaner donut look
  const circumference = 2 * Math.PI * radius;
  let currentSum = 0;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      
      {/* Toggle */}
      <View style={{ flexDirection: 'row', backgroundColor: theme.card, borderRadius: 24, padding: 4, marginBottom: 32, borderWidth: 1, borderColor: theme.border }}>
        <TouchableOpacity 
          onPress={() => setReportType('expense')}
          activeOpacity={0.8}
          style={{ flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: reportType === 'expense' ? theme.surface : 'transparent', borderRadius: 20, shadowColor: '#000', shadowOpacity: reportType === 'expense' ? 0.05 : 0, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: reportType === 'expense' ? 2 : 0 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: reportType === 'expense' ? theme.ink : theme.muted, fontFamily: 'Outfit_700Bold' }}>Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setReportType('income')}
          activeOpacity={0.8}
          style={{ flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: reportType === 'income' ? theme.surface : 'transparent', borderRadius: 20, shadowColor: '#000', shadowOpacity: reportType === 'income' ? 0.05 : 0, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: reportType === 'income' ? 2 : 0 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: reportType === 'income' ? theme.ink : theme.muted, fontFamily: 'Outfit_700Bold' }}>Income</Text>
        </TouchableOpacity>
      </View>

      {/* Chart */}
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        {total > 0 ? (
          <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
            <Svg height="220" width="220" viewBox="0 0 220 220" style={{ position: 'absolute' }}>
              <G rotation="-90" origin="110, 110">
                {chartData.map((item, index) => {
                  const fraction = item.amount / total;
                  const length = fraction * circumference;
                  const strokeDasharray = `${length} ${circumference}`;
                  const rotation = (currentSum / total) * 360;
                  currentSum += item.amount;

                  // Create a small gap between slices if there are multiple items
                  const gapOffset = chartData.length > 1 ? 4 : 0; 
                  // to do gaps properly with strokeDasharray is tricky, so we'll just draw them directly.

                  return (
                    <Circle
                      key={index}
                      cx="110"
                      cy="110"
                      r={radius}
                      stroke={item.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${Math.max(0, length - gapOffset)} ${circumference}`}
                      strokeLinecap="round"
                      fill="transparent"
                      rotation={rotation}
                      origin="110, 110"
                    />
                  );
                })}
              </G>
            </Svg>
            
            {/* Center Text */}
            <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background, width: 120, height: 120, borderRadius: 60 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.muted, fontFamily: 'Inter_500Medium', marginBottom: 4 }}>Total {reportType === 'expense' ? 'Expenses' : 'Income'}</Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: theme.ink, fontFamily: 'Outfit_700Bold', fontVariant: ['tabular-nums'] }}>
                ₹{total.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.border, borderRadius: 110, borderStyle: 'dashed' }}>
            <Text style={{ fontSize: 14, color: theme.muted, fontFamily: 'Inter_500Medium' }}>No {reportType}s</Text>
            <Text style={{ fontSize: 14, color: theme.muted, fontFamily: 'Inter_500Medium' }}>this month</Text>
          </View>
        )}
      </View>

      {/* Breakdown List */}
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: theme.ink, fontFamily: 'Outfit_700Bold' }}>All {reportType === 'expense' ? 'Expenses' : 'Income'}</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.ink, fontFamily: 'Outfit_700Bold' }}>Total ₹{total.toLocaleString('en-IN')}</Text>
        </View>

        {chartData.map((item, index) => {
          const percent = ((item.amount / total) * 100).toFixed(1);
          return (
            <View key={index} style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color }} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: theme.ink, fontFamily: 'Inter_700Bold' }}>{item.name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: theme.ink, fontFamily: 'Outfit_700Bold' }}>₹{item.amount.toLocaleString('en-IN')}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.muted, fontFamily: 'Inter_500Medium', marginTop: 2 }}>{percent}% of total</Text>
                </View>
              </View>
              
              {/* Progress Bar inside row */}
              <View style={{ height: 6, backgroundColor: theme.surface, borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${percent}%` as any, backgroundColor: item.color, borderRadius: 3 }} />
              </View>
            </View>
          );
        })}
      </View>

    </ScrollView>
  );
}
