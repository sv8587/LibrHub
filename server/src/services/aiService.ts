import { bookService } from './bookService';
import { transactionService } from './transactionService';
import { dashboardService } from './dashboardService';

export class AIService {
  async askAssistant(question: string): Promise<{ answer: string; confidence: 'heuristic'; sources?: any }> {
    if (!question || !question.trim()) {
      throw new Error('Question is required');
    }

    // Build the answer from live library data so the assistant remains
    // functional without requiring an external AI provider or API key.
    const { books } = await bookService.getAllBooks({ limit: 100 });
    const { transactions } = await transactionService.getAllTransactions({ limit: 100 });
    const dashboardStats = await dashboardService.getDashboardStats();

    const lower = question.toLowerCase();
    let fallbackAnswer = '';

    if (lower.includes('overdue')) {
      const overdue = dashboardStats.currentlyIssuedList.filter((item) => item.isOverdue);
      if (overdue.length === 0) {
        fallbackAnswer = 'Currently, there are no overdue books in the library! All active loans are on schedule.';
      } else {
        const details = overdue
          .map((o) => `• "${o.bookTitle}" (${o.bookId}) borrowed by ${o.borrowerName} (${o.borrowerId}) is ${o.daysOverdue} day(s) overdue.`)
          .join('\n');
        fallbackAnswer = `There are currently **${overdue.length} overdue book(s)**:\n\n${details}`;
      }
    } else if (lower.includes('how many') && (lower.includes('issued') || lower.includes('borrowed'))) {
      fallbackAnswer = `There are currently **${dashboardStats.stats.issuedBooks} books issued** out of ${dashboardStats.stats.totalPhysicalCopies} total physical copies across ${dashboardStats.stats.totalBooks} catalog titles.`;
    } else if (lower.includes('who') && (lower.includes('has') || lower.includes('borrowed') || lower.includes('lib-'))) {
      const match = question.match(/lib-?\d+/i);
      const targetId = match ? match[0].toUpperCase().replace('LIB', 'LIB-') : null;
      if (targetId) {
        const active = dashboardStats.currentlyIssuedList.filter((i) => i.bookId.toUpperCase().includes(targetId));
        if (active.length > 0) {
          const names = active
            .map((a) => `${a.borrowerName} (User ID: ${a.borrowerId}, Due: ${new Date(a.dueDate).toLocaleDateString()})`)
            .join(', ');
          fallbackAnswer = `Book **${targetId}** is currently issued to: ${names}.`;
        } else {
          const b = books.find((x) => x.bookId.toUpperCase().includes(targetId));
          if (b) {
            fallbackAnswer = `Book **${b.bookId}** ("${b.title}") has **${b.availableCopies} copy(ies) available** on the shelves and is not currently checked out.`;
          } else {
            fallbackAnswer = `Could not find any active checkout or book record for ID "${targetId}".`;
          }
        }
      } else {
        fallbackAnswer = 'Please specify a Book ID (for example: "Who has book LIB-102?").';
      }
    } else if (lower.includes('category') && (lower.includes('most') || lower.includes('popular'))) {
      const topCat = dashboardStats.charts.mostBorrowedCategories[0];
      if (topCat) {
        fallbackAnswer = `The most borrowed category is **${topCat.category}** with **${topCat.borrows} total checkouts**.`;
      } else {
        fallbackAnswer = 'Not enough transaction data yet to determine the top category.';
      }
    } else if (
      lower.includes('low availability') ||
      lower.includes('out of stock') ||
      lower.includes('zero copies')
    ) {
      const low = books.filter((b) => b.availableCopies <= 1);
      const list = low
        .map((b) => `• "${b.title}" (${b.bookId}) - ${b.availableCopies} available of ${b.totalCopies}`)
        .join('\n');
      fallbackAnswer = low.length
        ? `Here are the books with low or zero availability:\n\n${list}`
        : 'All books currently have more than one available copy.';
    } else {
      fallbackAnswer = `**LibrHub Assistant (Live DB)**:\nTotal catalog items: ${dashboardStats.stats.totalBooks} titles (${dashboardStats.stats.availableBooks} copies available, ${dashboardStats.stats.issuedBooks} active loans, ${dashboardStats.stats.overdueBooks} overdue).\n\nTry asking: "Which books are overdue?", "Who currently has book LIB-102?", or "Which books have low availability?".`;
    }

    return {
      answer: fallbackAnswer,
      confidence: 'heuristic',
      sources: {
        totalBooksEvaluated: books.length,
        activeLoansEvaluated: dashboardStats.currentlyIssuedList.length,
        transactionsEvaluated: transactions.length,
      },
    };
  }
}

export const aiService = new AIService();
export default aiService;
