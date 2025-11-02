import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  DashboardSummaryDto,
  UsageStatsDto,
  TodayCostDto,
  FrequentQuestionDto,
  StudentActivitySummaryDto,
} from './types';

/**
 * Export analytics data to CSV format
 */
export function exportAnalyticsToCSV(data: {
  summary?: DashboardSummaryDto | null;
  todayUsage?: UsageStatsDto | null;
  todayCost?: TodayCostDto | null;
  frequentQuestions?: FrequentQuestionDto[];
  topStudents?: StudentActivitySummaryDto[];
  period: string;
  dateRange?: { start: Date; end: Date };
}) {
  const { summary, todayUsage, todayCost, frequentQuestions, topStudents, period, dateRange } = data;

  // Build CSV content
  let csvContent = 'Analytics Report\n';
  csvContent += `Period: ${period}\n`;

  if (dateRange) {
    csvContent += `Date Range: ${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}\n`;
  }

  csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

  // Overview Stats
  if (summary?.overview) {
    csvContent += 'Overview Statistics\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Total Messages,${summary.overview.totalMessages ?? 0}\n`;
    csvContent += `Unique Students,${summary.overview.uniqueStudents ?? 0}\n`;
    csvContent += `Active Modules,${summary.overview.activeModules ?? 0}\n`;
    csvContent += `Active Courses,${summary.overview.activeCourses ?? 0}\n`;
    csvContent += `Estimated Cost (USD),$${(summary.overview.totalCostUSD ?? 0).toFixed(2)}\n\n`;
  }

  // Today's Usage
  if (todayUsage) {
    csvContent += 'Today\'s Usage\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Messages,${todayUsage.totalMessages ?? 0}\n`;
    csvContent += `Students,${todayUsage.uniqueStudents ?? 0}\n`;
    csvContent += `Conversations,${todayUsage.uniqueConversations ?? 0}\n`;
    csvContent += `Avg Response Time (ms),${(todayUsage.averageResponseTime ?? 0).toFixed(2)}\n\n`;
  }

  // Today's Cost
  if (todayCost) {
    csvContent += 'Today\'s Cost\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Total Cost (USD),$${todayCost.estimatedCostUSD.toFixed(2)}\n`;
    csvContent += `Total Tokens,${todayCost.totalTokens}\n`;
    csvContent += `Messages,${todayCost.totalMessages}\n\n`;
  }

  // Frequently Asked Questions
  if (frequentQuestions && frequentQuestions.length > 0) {
    csvContent += 'Frequently Asked Questions\n';
    csvContent += 'Question,Count,Percentage\n';
    frequentQuestions.forEach((faq) => {
      const question = faq.question.replace(/"/g, '""'); // Escape quotes
      csvContent += `"${question}",${faq.count},${faq.percentage.toFixed(1)}%\n`;
    });
    csvContent += '\n';
  }

  // Top Active Students
  if (topStudents && topStudents.length > 0) {
    csvContent += 'Top Active Students\n';
    csvContent += 'Student Name,Email,Messages,Conversations,Tokens,Cost (USD)\n';
    topStudents.forEach((student) => {
      const name = (student.studentName || '').replace(/"/g, '""');
      const email = (student.studentEmail || '').replace(/"/g, '""');
      csvContent += `"${name}","${email}",${student.messageCount ?? 0},${student.conversationCount ?? 0},${student.totalTokens ?? 0},$${(student.estimatedCostUSD ?? 0).toFixed(2)}\n`;
    });
  }

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export analytics data to PDF format
 */
export function exportAnalyticsToPDF(data: {
  summary?: DashboardSummaryDto | null;
  todayUsage?: UsageStatsDto | null;
  todayCost?: TodayCostDto | null;
  frequentQuestions?: FrequentQuestionDto[];
  topStudents?: StudentActivitySummaryDto[];
  period: string;
  dateRange?: { start: Date; end: Date };
  universityName?: string;
}) {
  const { summary, todayUsage, todayCost, frequentQuestions, topStudents, period, dateRange, universityName } = data;

  const doc = new jsPDF();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Analytics Report', 105, yPosition, { align: 'center' });
  yPosition += 10;

  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${period}`, 105, yPosition, { align: 'center' });
  yPosition += 6;

  if (dateRange) {
    doc.text(`${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`, 105, yPosition, { align: 'center' });
    yPosition += 6;
  }

  if (universityName) {
    doc.text(`University: ${universityName}`, 105, yPosition, { align: 'center' });
    yPosition += 6;
  }

  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, yPosition, { align: 'center' });
  yPosition += 15;

  // Overview Statistics
  if (summary?.overview) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Overview Statistics', 14, yPosition);
    yPosition += 7;

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Total Messages', (summary.overview.totalMessages ?? 0).toLocaleString()],
        ['Unique Students', (summary.overview.uniqueStudents ?? 0).toLocaleString()],
        ['Active Modules', (summary.overview.activeModules ?? 0).toString()],
        ['Active Courses', (summary.overview.activeCourses ?? 0).toString()],
        ['Estimated Cost (USD)', `$${(summary.overview.totalCostUSD ?? 0).toFixed(2)}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Today's Metrics
  if (todayUsage && todayCost) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Today\'s Metrics', 14, yPosition);
    yPosition += 7;

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Messages', (todayUsage.totalMessages ?? 0).toLocaleString()],
        ['Unique Students', (todayUsage.uniqueStudents ?? 0).toString()],
        ['Conversations', (todayUsage.uniqueConversations ?? 0).toString()],
        ['Avg Response Time', `${((todayUsage.averageResponseTime ?? 0) / 1000).toFixed(2)}s`],
        ['Total Cost', `$${(todayCost.estimatedCostUSD ?? 0).toFixed(2)}`],
        ['Total Tokens', (todayCost.totalTokens ?? 0).toLocaleString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Add new page if needed
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  // Frequently Asked Questions
  if (frequentQuestions && frequentQuestions.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Frequently Asked Questions', 14, yPosition);
    yPosition += 7;

    autoTable(doc, {
      startY: yPosition,
      head: [['Question', 'Count', '%']],
      body: frequentQuestions.map((faq) => [
        faq.question.length > 80 ? faq.question.substring(0, 77) + '...' : faq.question,
        faq.count.toString(),
        `${faq.percentage.toFixed(1)}%`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 30, halign: 'right' },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Add new page if needed
  if (yPosition > 250 && topStudents && topStudents.length > 0) {
    doc.addPage();
    yPosition = 20;
  }

  // Top Active Students
  if (topStudents && topStudents.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Active Students', 14, yPosition);
    yPosition += 7;

    autoTable(doc, {
      startY: yPosition,
      head: [['Student', 'Messages', 'Conversations', 'Cost']],
      body: topStudents.map((student) => [
        student.studentName || student.studentEmail || `Student #${student.studentId}`,
        (student.messageCount ?? 0).toString(),
        (student.conversationCount ?? 0).toString(),
        `$${(student.estimatedCostUSD ?? 0).toFixed(2)}`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });
  }

  // Save PDF
  doc.save(`analytics_report_${new Date().toISOString().split('T')[0]}.pdf`);
}
