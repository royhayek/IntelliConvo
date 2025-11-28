import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  maxVisible?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisible = 5,
  className,
}: PaginationProps) {
  // Validate inputs to prevent showing invalid pages
  // Convert to number and default to 1 if invalid (handles undefined, null, NaN, etc.)
  const validTotalPages = Math.max(1, Math.floor(Number(totalPages) || 1));
  const validCurrentPage = Math.max(1, Math.min(Math.floor(Number(currentPage) || 1), validTotalPages));

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (validTotalPages <= maxVisible) {
      for (let i = 1; i <= validTotalPages; i++) {
        pages.push(i);
      }
    } else {
      const leftSide = Math.floor(maxVisible / 2);
      const rightSide = maxVisible - leftSide - 1;

      if (validCurrentPage <= leftSide + 1) {
        for (let i = 1; i <= maxVisible - 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(validTotalPages);
      } else if (validCurrentPage >= validTotalPages - rightSide) {
        pages.push(1);
        pages.push("...");
        for (let i = validTotalPages - maxVisible + 2; i <= validTotalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = validCurrentPage - leftSide + 1; i <= validCurrentPage + rightSide - 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(validTotalPages);
      }
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav
      className={cn("flex items-center justify-center gap-1", className)}
      aria-label="Pagination"
    >
      {showFirstLast && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={validCurrentPage === 1}
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(validCurrentPage - 1)}
        disabled={validCurrentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages.map((page, index) => {
        if (page === "...") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="px-3 py-2 text-gray-600 dark:text-gray-400"
            >
              ...
            </span>
          );
        }

        return (
          <Button
            key={page}
            variant={validCurrentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page as number)}
            aria-label={`Page ${page}`}
            aria-current={validCurrentPage === page ? "page" : undefined}
            className={cn(
              validCurrentPage === page && "bg-indigo-600 hover:bg-indigo-700"
            )}
          >
            {page}
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(validCurrentPage + 1)}
        disabled={validCurrentPage === validTotalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {showFirstLast && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(validTotalPages)}
          disabled={validCurrentPage === validTotalPages}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      )}
    </nav>
  );
}
