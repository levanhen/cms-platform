"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRoleAction, updateRoleAction } from "@/features/roles/actions";

type PermissionOption = {
  id: string;
  code: string;
  groupName: string;
  description: string | null;
};

export function RoleForm({
  permissions,
  initial,
  lockName = false,
  lockPermissions = false,
}: {
  permissions: PermissionOption[];
  initial?: {
    id: string;
    name: string;
    description: string | null;
    permissionIds: string[];
  };
  lockName?: boolean;
  lockPermissions?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [selected, setSelected] = useState<string[]>(initial?.permissionIds ?? []);

  const grouped = useMemo(() => {
    const map = new Map<string, PermissionOption[]>();
    for (const permission of permissions) {
      const list = map.get(permission.groupName) ?? [];
      list.push(permission);
      map.set(permission.groupName, list);
    }
    return Array.from(map.entries());
  }, [permissions]);

  function toggle(id: string, checked: boolean) {
    setSelected((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((item) => item !== id),
    );
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          name,
          description,
          permissionIds: selected,
        };
        const result = initial
          ? await updateRoleAction(initial.id, payload)
          : await createRoleAction(payload);

        if (!result.ok) {
          notify.error("message" in result ? result.message : "Không thể lưu vai trò.");
          return;
        }

        notify.success(initial ? "Đã cập nhật vai trò." : "Đã tạo vai trò.");
        router.push("/roles");
        router.refresh();
      } catch (error) {
        notify.unexpected(error);
      }
    });
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="grid max-w-xl gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Tên vai trò</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={lockName}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Mô tả</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold">Gán quyền</h2>
        {lockPermissions ? (
          <p className="text-sm text-muted-foreground">
            Vai trò hệ thống: quyền được khóa và không thể chỉnh sửa từ giao diện.
          </p>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-2">
          {grouped.map(([groupName, items]) => (
            <div key={groupName} className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 font-medium">{groupName}</p>
              <ul className="space-y-2">
                {items.map((item) => {
                  const checked = selected.includes(item.id);
                  return (
                    <li key={item.id} className="flex items-start gap-2">
                      <Checkbox
                        checked={checked}
                        disabled={lockPermissions}
                        onCheckedChange={(value) => toggle(item.id, Boolean(value))}
                        id={item.id}
                      />
                      <label htmlFor={item.id} className="text-sm leading-tight">
                        <span className="font-medium">{item.code}</span>
                        {item.description ? (
                          <span className="mt-0.5 block text-muted-foreground">
                            {item.description}
                          </span>
                        ) : null}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="font-semibold">
          {pending ? "Đang lưu..." : "Lưu"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/roles")}>
          Hủy
        </Button>
      </div>
    </form>
  );
}
