import { prisma } from "@cms/db";
import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requirePagePermission } from "@/lib/permissions/require-page";

export default async function PermissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "role:view");

  const params = await searchParams;
  const search = params.search?.trim() ?? "";

  const permissions = await prisma.permission.findMany({
    where: search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" } },
            { groupName: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ groupName: "asc" }, { code: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Quyền"
        description="Catalog permission (seed). Chỉ xem trong MVP."
      
        breadcrumbs={[{ label: "Quyền" }]}
      />
      <form className="mb-4">
        <input
          name="search"
          defaultValue={search}
          placeholder="Tìm theo code, nhóm..."
          className="h-10 w-full max-w-md rounded-lg border border-border bg-card px-3 text-sm"
        />
      </form>
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhóm</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Mô tả</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((permission) => (
              <TableRow key={permission.id}>
                <TableCell>{permission.groupName}</TableCell>
                <TableCell className="font-mono text-xs">{permission.code}</TableCell>
                <TableCell>{permission.description || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
