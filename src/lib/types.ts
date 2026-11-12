// Row shapes mirror the ERD in PRD.md section 5 exactly.
// Do not add or rename columns here without changing the PRD first.

export type BookStatus = "WANT_TO_READ" | "READING" | "FINISHED" | "DNF";

export interface BookRow {
  id: string;
  user_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  category: string | null;
  total_pages: number;
  current_page: number;
  status: BookStatus;
  rating: number | null;
  review: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface ReadingLogRow {
  id: string;
  book_id: string;
  log_date: string;
  start_page: number;
  end_page: number;
  pages_read: number;
  duration_minutes: number | null;
  daily_note: string | null;
  created_at: string;
}

export interface QuoteRow {
  id: string;
  book_id: string;
  content: string;
  page_number: number | null;
  chapter: string | null;
  personal_note: string | null;
  is_favorite: boolean;
  created_at: string;
}

export interface TagRow {
  id: string;
  name: string;
  color_hex: string | null;
}

export interface QuoteTagRow {
  quote_id: string;
  tag_id: string;
}

export interface ReadingGoalRow {
  id: string;
  user_id: string;
  year: number;
  target_books: number;
  target_pages_per_day: number;
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  created_at: string;
}
