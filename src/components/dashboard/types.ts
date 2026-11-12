export interface BookOption {
  id: string;
  title: string;
  author: string;
  current_page: number;
  total_pages: number;
}

export function toBookOption(book: {
  id: string;
  title: string;
  author: string;
  current_page: number;
  total_pages: number;
}): BookOption {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    current_page: book.current_page,
    total_pages: book.total_pages,
  };
}
