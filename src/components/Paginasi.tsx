import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

/**
 * Navigasi halaman untuk daftar berhalaman. Parameter lain di URL (pencarian,
 * penyaring) dipertahankan; hanya `hal` yang berganti.
 *
 * Page navigation for paginated lists. Other URL params (search, filters)
 * are kept; only `hal` changes.
 */
export function Paginasi({
  halaman,
  totalBaris,
  perHalaman,
  params,
}: {
  halaman: number;
  totalBaris: number;
  perHalaman: number;
  params: Record<string, string | undefined>;
}) {
  const totalHalaman = Math.max(1, Math.ceil(totalBaris / perHalaman));
  if (totalHalaman === 1) return null;

  const href = (hal: number) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && sp.set(k, v));
    sp.set("hal", String(hal));
    return `?${sp}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Halaman {halaman} dari {totalHalaman} · {totalBaris} data
      </p>
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              text="Sebelumnya"
              href={href(halaman - 1)}
              aria-disabled={halaman <= 1}
              className={halaman <= 1 ? "pointer-events-none opacity-50" : undefined}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href={href(halaman)} isActive>
              {halaman}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              text="Berikutnya"
              href={href(halaman + 1)}
              aria-disabled={halaman >= totalHalaman}
              className={halaman >= totalHalaman ? "pointer-events-none opacity-50" : undefined}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
