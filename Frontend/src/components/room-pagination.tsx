"use client";

import { useSearchParams } from "next/navigation";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface RoomPaginationProps {
  totalPages: number;
  hasMore: boolean;
  role: string;
}

const genParams = (
  page: number,
  min: string | null,
  max: string | null,
  badgesQuery: string | null,
  featuresQuery: string | null
) => {
  let params = `page=${page}`;
  if (min) {
    params = params.concat(`&minPrice=${min}`);
  }
  if (max) {
    params = params.concat(`&maxPrice=${max}`);
  }
  if (badgesQuery) {
    params = params.concat(`&badges=${badgesQuery}`);
  }
  if (featuresQuery) {
    params = params.concat(`&features=${featuresQuery}`);
  }
  return params;
};

const RoomPagination = ({ totalPages, hasMore, role }: RoomPaginationProps) => {
  const baseUrl = role === "manager" ? "/dashboard/homepage" : "/home";
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const min = searchParams.get("minPrice");
  const max = searchParams.get("maxPrice");
  const badgesQuery = searchParams.get("badges");
  const featuresQuery = searchParams.get("features");
  return (
    <Pagination className="mt-3">
      <PaginationContent>
        {currentPage !== 1 && (
          <PaginationItem>
            <PaginationPrevious
              href={`${baseUrl}?${genParams(currentPage - 1, min, max, badgesQuery, featuresQuery)}`}
            />
          </PaginationItem>
        )}

        {Array.from({ length: totalPages }, (_, i) => i + 1).map(
          (pageNumber) => (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                isActive={currentPage === pageNumber}
                href={`${baseUrl}?${genParams(pageNumber, min, max, badgesQuery, featuresQuery)}`}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        {hasMore && (
          <PaginationItem>
            <PaginationNext
              href={`${baseUrl}?${genParams(currentPage + 1, min, max, badgesQuery, featuresQuery)}`}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
};

export default RoomPagination;
