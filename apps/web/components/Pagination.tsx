type PaginationProps = {
  currentPage: number;
  totalPages: number;
};

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  return (
    <nav aria-label="Pagination">
      <p>
        Page {currentPage} of {totalPages}
      </p>
    </nav>
  );
}
