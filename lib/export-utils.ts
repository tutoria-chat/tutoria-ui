import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { UserOptions } from 'jspdf-autotable';
import type {
  DashboardSummaryDto,
  UsageStatsDto,
  TodayCostDto,
  FrequentQuestionDto,
  StudentActivitySummaryDto,
} from './types';

// Extend jsPDF type to include autoTable properties
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

/**
 * Translations interface for export functions
 */
export interface ExportTranslations {
  title: string;
  period: string;
  dateRange: string;
  generated: string;
  university: string;
  overviewTitle: string;
  metric: string;
  value: string;
  totalMessages: string;
  uniqueStudents: string;
  activeModules: string;
  activeCourses: string;
  estimatedCost: string;
  todayUsageTitle: string;
  messages: string;
  students: string;
  conversations: string;
  avgResponseTime: string;
  todayCostTitle: string;
  totalCost: string;
  totalTokens: string;
  frequentQuestionsTitle: string;
  question: string;
  count: string;
  percentage: string;
  topStudentsTitle: string;
  studentName: string;
  email: string;
  tokens: string;
  cost: string;
}

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
  translations: ExportTranslations;
}) {
  try {
    const { summary, todayUsage, todayCost, frequentQuestions, topStudents, period, dateRange, translations: t } = data;

    // Validate that we have at least some data to export
    if (!summary && !todayUsage && !todayCost && (!frequentQuestions || frequentQuestions.length === 0) && (!topStudents || topStudents.length === 0)) {
      throw new Error('No data available to export');
    }

    // Build CSV content
    let csvContent = `${t.title}\n`;
    csvContent += `${t.period}: ${period}\n`;

    if (dateRange) {
      csvContent += `${t.dateRange}: ${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}\n`;
    }

    csvContent += `${t.generated}: ${new Date().toLocaleString()}\n\n`;

    // Overview Stats
    if (summary?.overview) {
      csvContent += `${t.overviewTitle}\n`;
      csvContent += `${t.metric},${t.value}\n`;
      csvContent += `${t.totalMessages},${summary.overview.totalMessages ?? 0}\n`;
      csvContent += `${t.uniqueStudents},${summary.overview.uniqueStudents ?? 0}\n`;
      csvContent += `${t.activeModules},${summary.overview.activeModules ?? 0}\n`;
      csvContent += `${t.activeCourses},${summary.overview.activeCourses ?? 0}\n`;
      csvContent += `${t.estimatedCost} (USD),$${(summary.overview.totalCostUSD ?? 0).toFixed(2)}\n\n`;
    }

    // Today's Usage
    if (todayUsage) {
      csvContent += `${t.todayUsageTitle}\n`;
      csvContent += `${t.metric},${t.value}\n`;
      csvContent += `${t.messages},${todayUsage.totalMessages ?? 0}\n`;
      csvContent += `${t.students},${todayUsage.uniqueStudents ?? 0}\n`;
      csvContent += `${t.conversations},${todayUsage.uniqueConversations ?? 0}\n`;
      csvContent += `${t.avgResponseTime} (ms),${(todayUsage.averageResponseTime ?? 0).toFixed(2)}\n\n`;
    }

    // Today's Cost
    if (todayCost) {
      csvContent += `${t.todayCostTitle}\n`;
      csvContent += `${t.metric},${t.value}\n`;
      csvContent += `${t.totalCost} (USD),$${todayCost.estimatedCostUSD.toFixed(2)}\n`;
      csvContent += `${t.totalTokens},${todayCost.totalTokens}\n`;
      csvContent += `${t.messages},${todayCost.totalMessages}\n\n`;
    }

    // Frequently Asked Questions
    if (frequentQuestions && frequentQuestions.length > 0) {
      csvContent += `${t.frequentQuestionsTitle}\n`;
      csvContent += `${t.question},${t.count},${t.percentage}\n`;
      frequentQuestions.forEach((faq) => {
        const question = faq.question.replace(/"/g, '""'); // Escape quotes
        csvContent += `"${question}",${faq.count},${faq.percentage.toFixed(1)}%\n`;
      });
      csvContent += '\n';
    }

    // Top Active Students
    if (topStudents && topStudents.length > 0) {
      csvContent += `${t.topStudentsTitle}\n`;
      csvContent += `${t.studentName},${t.email},${t.messages},${t.conversations},${t.tokens},${t.cost} (USD)\n`;
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

    try {
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
    } finally {
      // Cleanup: remove link and revoke URL to prevent memory leak
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error exporting analytics to CSV:', error);
    throw error; // Re-throw to allow caller to handle
  }
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
  translations: ExportTranslations;
}) {
  try {
    const { summary, todayUsage, todayCost, frequentQuestions, topStudents, period, dateRange, universityName, translations: t } = data;

    // Validate that we have at least some data to export
    if (!summary && !todayUsage && !todayCost && (!frequentQuestions || frequentQuestions.length === 0) && (!topStudents || topStudents.length === 0)) {
      throw new Error('No data available to export');
    }

    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(t.title, 105, yPosition, { align: 'center' });
    yPosition += 10;

    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t.period}: ${period}`, 105, yPosition, { align: 'center' });
    yPosition += 6;

    if (dateRange) {
      doc.text(`${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`, 105, yPosition, { align: 'center' });
      yPosition += 6;
    }

    if (universityName) {
      doc.text(`${t.university}: ${universityName}`, 105, yPosition, { align: 'center' });
      yPosition += 6;
    }

    doc.text(`${t.generated}: ${new Date().toLocaleString()}`, 105, yPosition, { align: 'center' });
    yPosition += 15;

    // Overview Statistics
    if (summary?.overview) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(t.overviewTitle, 14, yPosition);
      yPosition += 7;

      autoTable(doc, {
        startY: yPosition,
        head: [[t.metric, t.value]],
        body: [
          [t.totalMessages, (summary.overview.totalMessages ?? 0).toLocaleString()],
          [t.uniqueStudents, (summary.overview.uniqueStudents ?? 0).toLocaleString()],
          [t.activeModules, (summary.overview.activeModules ?? 0).toString()],
          [t.activeCourses, (summary.overview.activeCourses ?? 0).toString()],
          [t.estimatedCost + ' (USD)', `$${(summary.overview.totalCostUSD ?? 0).toFixed(2)}`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      yPosition = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
    }

    // Today's Metrics
    if (todayUsage && todayCost) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(t.todayUsageTitle, 14, yPosition);
      yPosition += 7;

      autoTable(doc, {
        startY: yPosition,
        head: [[t.metric, t.value]],
        body: [
          [t.messages, (todayUsage.totalMessages ?? 0).toLocaleString()],
          [t.students, (todayUsage.uniqueStudents ?? 0).toString()],
          [t.conversations, (todayUsage.uniqueConversations ?? 0).toString()],
          [t.avgResponseTime, `${((todayUsage.averageResponseTime ?? 0) / 1000).toFixed(2)}s`],
          [t.totalCost, `$${(todayCost.estimatedCostUSD ?? 0).toFixed(2)}`],
          [t.totalTokens, (todayCost.totalTokens ?? 0).toLocaleString()],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      yPosition = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
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
      doc.text(t.frequentQuestionsTitle, 14, yPosition);
      yPosition += 7;

      autoTable(doc, {
        startY: yPosition,
        head: [[t.question, t.count, '%']],
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

      yPosition = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
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
      doc.text(t.topStudentsTitle, 14, yPosition);
      yPosition += 7;

      autoTable(doc, {
        startY: yPosition,
        head: [[t.studentName, t.messages, t.conversations, t.cost]],
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
  } catch (error) {
    console.error('Error exporting analytics to PDF:', error);
    throw error; // Re-throw to allow caller to handle
  }
}
