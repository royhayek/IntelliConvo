import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { getPaginationText } from "@/lib/utils/pagination";

interface TablePaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemName?: string;
  showPageNumbers?: boolean;
}

export function TablePagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  itemName = "items",
  showPageNumbers = true,
}: TablePaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t dark:border-slate-700">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {getPaginationText({ page, limit, total }, itemName)}
      </p>
      {showPageNumbers ? (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          showFirstLast={totalPages > 5}
        />
      ) : (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
