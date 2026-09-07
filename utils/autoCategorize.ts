export function guessCategoryId(note: string, type: 'income' | 'expense'): string {
  const text = note.toLowerCase();

  if (type === 'income') {
    if (/salary|payroll|wage/.test(text)) return 'cat-salary';
    if (/freelance|fiverr|upwork|contract/.test(text)) return 'cat-freelance';
    if (/gift|pocket|bonus|cashback|refund/.test(text)) return 'cat-gift';
    return 'cat-other-inc';
  }

  // Expenses
  if (/zomato|swiggy|food|lunch|dinner|breakfast|mcdonald|kfc|burger|pizza|restaurant|cafe|coffee|starbucks/.test(text)) return 'cat-food';
  if (/uber|ola|rapido|petrol|fuel|gas|train|flight|bus|metro|irctc|makemytrip/.test(text)) return 'cat-transport';
  if (/amazon|flipkart|myntra|zara|h&m|clothes|shopping|shoes|mart|supermarket|grocery|groceries|bigbasket|blinkit|zepto/.test(text)) return 'cat-shopping';
  if (/school|college|tuition|udemy|coursera|book|stationery|fee/.test(text)) return 'cat-education';
  if (/hospital|doctor|pharmacy|medicine|apollo|1mg|clinic|health|gym/.test(text)) return 'cat-health';
  if (/recharge|mobile|sim|jio|airtel|vi\b|bsnl/.test(text)) return 'cat-recharge';
  if (/emi|loan|installment|equated/.test(text)) return 'cat-emi';
  if (/rent|electricity|water|wifi|internet|gas.*bill|bill|insurance/.test(text)) return 'cat-bills';
  if (/movie|netflix|prime|hotstar|spotify|game|steam|party|club|pub|trip|fun/.test(text)) return 'cat-fun';

  return 'cat-other-exp';
}
