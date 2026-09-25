export const getMonthKey = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function getMonthRange(referenceDate: Date, startDay: number): { start: string, end: string } {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();
  const currentDay = referenceDate.getDate();

  let startYear = currentYear;
  let startMonth = currentMonth;

  if (currentDay < startDay) {
    // We are in the "previous" billing month
    startMonth -= 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear -= 1;
    }
  }

  const startDate = new Date(startYear, startMonth, startDay, 0, 0, 0, 0);
  const endDate = new Date(startYear, startMonth + 1, startDay, 0, 0, 0, 0);

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  };
}

export function getDisplayMonth(referenceDate: Date, startDay: number): string {
  const { start, end } = getMonthRange(referenceDate, startDay);
  const startDate = new Date(start);
  const endDate = new Date(end);
  endDate.setDate(endDate.getDate() - 1);

  if (startDay === 1) {
    return startDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  } else {
    const startStr = startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const endStr = endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return `${startStr} - ${endStr}`;
  }
}

export function addMonths(date: Date, numMonths: number): Date {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + numMonths);
  return newDate;
}
