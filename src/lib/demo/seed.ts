import { addDays, todayISO } from "@/lib/date";
import type {
  BookRow,
  QuoteRow,
  QuoteTagRow,
  ReadingGoalRow,
  ReadingLogRow,
  TagRow,
  UserRow,
} from "@/lib/types";

export interface DemoDb {
  users: UserRow[];
  books: BookRow[];
  reading_logs: ReadingLogRow[];
  quotes: QuoteRow[];
  tags: TagRow[];
  quote_tags: QuoteTagRow[];
  reading_goals: ReadingGoalRow[];
}

export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

/**
 * Sample data for demo mode. Every row here is invented for the demo reader
 * and is labelled as such in the UI, so nothing pretends to be real reading
 * history.
 */
export function createSeed(): DemoDb {
  const today = todayISO();
  const year = Number(today.slice(0, 4));
  const now = new Date().toISOString();

  const habitsId = "b0000000-0000-4000-8000-000000000001";
  const readingId = "b0000000-0000-4000-8000-000000000002";
  const writingId = "b0000000-0000-4000-8000-000000000003";
  const shelfId = "b0000000-0000-4000-8000-000000000004";

  const books: BookRow[] = [
    {
      id: habitsId,
      user_id: DEMO_USER_ID,
      title: "Kebiasaan Kecil",
      author: "Nara Pustaka",
      cover_url: null,
      category: "Non-fiksi",
      total_pages: 320,
      current_page: 142,
      status: "READING",
      rating: null,
      review: null,
      started_at: addDays(today, -24),
      finished_at: null,
      created_at: now,
    },
    {
      id: readingId,
      user_id: DEMO_USER_ID,
      title: "Cara Membaca Buku",
      author: "Sari Ananta",
      cover_url: null,
      category: "Esai",
      total_pages: 248,
      current_page: 96,
      status: "READING",
      rating: null,
      review: null,
      started_at: addDays(today, -18),
      finished_at: null,
      created_at: now,
    },
    {
      id: writingId,
      user_id: DEMO_USER_ID,
      title: "Ruang Menulis",
      author: "Bimo Aditya",
      cover_url: null,
      category: "Memoar",
      total_pages: 198,
      current_page: 198,
      status: "FINISHED",
      rating: 4,
      review: "Bab soal menulis ulang draft paling berguna.",
      started_at: `${year}-01-08`,
      finished_at: `${year}-02-18`,
      created_at: now,
    },
    {
      id: shelfId,
      user_id: DEMO_USER_ID,
      title: "Seni Menunda",
      author: "Laras Widuri",
      cover_url: null,
      category: "Non-fiksi",
      total_pages: 276,
      current_page: 0,
      status: "WANT_TO_READ",
      rating: null,
      review: null,
      started_at: null,
      finished_at: null,
      created_at: now,
    },
  ];

  // Reading days for the main book, newest last. The final seven days are
  // consecutive so the dashboard has a streak to show.
  const habitDays: Array<[number, number]> = [
    [-20, 9],
    [-19, 12],
    [-17, 8],
    [-16, 11],
    [-15, 10],
    [-13, 7],
    [-12, 12],
    [-11, 9],
    [-10, 10],
    [-7, 11],
    [-6, 9],
    [-5, 12],
    [-4, 10],
    [-3, 8],
    [-2, 11],
    [-1, 9],
    [0, 12],
  ];

  const readingLogs: ReadingLogRow[] = [];
  let page = 0;
  for (const [offset, pages] of habitDays) {
    const startPage = page;
    page += pages;
    readingLogs.push({
      id: `l0000000-0000-4000-8000-${String(readingLogs.length + 1).padStart(12, "0")}`,
      book_id: habitsId,
      log_date: addDays(today, offset),
      start_page: startPage,
      end_page: page,
      pages_read: pages,
      duration_minutes: 25 + (Math.abs(offset) % 4) * 5,
      daily_note:
        offset === 0
          ? "Bab 5 soal isyarat lingkungan, paling banyak dicatat."
          : null,
      created_at: now,
    });
  }

  books[0].current_page = page;

  const essayDays: Array<[number, number]> = [
    [-18, 14],
    [-14, 11],
    [-9, 13],
  ];
  let essayPage = 48;
  for (const [offset, pages] of essayDays) {
    const startPage = essayPage;
    essayPage += pages;
    readingLogs.push({
      id: `l0000000-0000-4000-8000-${String(readingLogs.length + 1).padStart(12, "0")}`,
      book_id: readingId,
      log_date: addDays(today, offset),
      start_page: startPage,
      end_page: essayPage,
      pages_read: pages,
      duration_minutes: 20,
      daily_note: null,
      created_at: now,
    });
  }

  books[1].current_page = essayPage;

  const tags: TagRow[] = [
    { id: "t0000000-0000-4000-8000-000000000001", name: "kebiasaan", color_hex: null },
    { id: "t0000000-0000-4000-8000-000000000002", name: "filosofi", color_hex: null },
  ];

  const quotes: QuoteRow[] = [
    {
      id: "q0000000-0000-4000-8000-000000000001",
      book_id: habitsId,
      content:
        "Perubahan besar jarang datang dari satu keputusan besar, lebih sering dari satu kebiasaan kecil yang diulang tanpa drama.",
      page_number: 64,
      chapter: "Bab 2",
      personal_note: "Ingat ini saat ingin mengubah sesuatu dalam seminggu.",
      is_favorite: true,
      created_at: now,
    },
    {
      id: "q0000000-0000-4000-8000-000000000002",
      book_id: habitsId,
      content:
        "Lingkungan lebih jujur daripada niat. Kalau buku ada di meja, membaca jadi pilihan yang paling mudah.",
      page_number: 138,
      chapter: "Bab 5",
      personal_note: null,
      is_favorite: false,
      created_at: now,
    },
    {
      id: "q0000000-0000-4000-8000-000000000003",
      book_id: readingId,
      content:
        "Membaca lambat bukan gagal cepat. Ada halaman yang memang perlu duduk lebih lama.",
      page_number: 92,
      chapter: null,
      personal_note: null,
      is_favorite: true,
      created_at: now,
    },
  ];

  const quoteTags: QuoteTagRow[] = [
    { quote_id: quotes[0].id, tag_id: tags[0].id },
    { quote_id: quotes[2].id, tag_id: tags[1].id },
  ];

  const readingGoals: ReadingGoalRow[] = [
    {
      id: "g0000000-0000-4000-8000-000000000001",
      user_id: DEMO_USER_ID,
      year,
      target_books: 12,
      target_pages_per_day: 20,
    },
  ];

  return {
    users: [
      {
        id: DEMO_USER_ID,
        name: "Pembaca",
        email: "pembaca@marginalia.app",
        created_at: now,
      },
    ],
    books,
    reading_logs: readingLogs,
    quotes,
    tags,
    quote_tags: quoteTags,
    reading_goals: readingGoals,
  };
}
