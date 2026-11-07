"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUserAction, updateUserAction } from "@/features/users/actions";

type UserStatus = "ACTIVE" | "INACTIVE";
type RoleOption = { id: string; name: string };

export function UserForm({
  roles,
  initial,
}: {
  roles: RoleOption[];
  initial?: {
    id: string;
    email: string;
    username: string;
    name: string;
    status: UserStatus;
    roleId: string;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState(initial?.email ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<UserStatus>(initial?.status ?? "ACTIVE");
  const [roleId, setRoleId] = useState(initial?.roleId ?? roles[0]?.id ?? "");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const result = initial
          ? await updateUserAction({
              id: initial.id,
              email,
              username,
              name,
              password,
              status,
              roleId,
            })
          : await createUserAction({
              email,
              username,
              name,
              password,
              status,
              roleId,
            });

        if (!result.ok) {
          notify.error("message" in result ? result.message : "Không thể lưu người dùng.");
          return;
        }

        notify.success(initial ? "Đã cập nhật người dùng." : "Đã tạo người dùng.");
        router.push("/users");
        router.refresh();
      } catch (error) {
        notify.unexpected(error);
      }
    });
  }

  return (
    <form className="max-w-xl space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name">Họ tên</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Tên đăng nhập</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">
          Mật khẩu {initial ? "(để trống nếu không đổi)" : ""}
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={!initial}
          minLength={initial ? undefined : 8}
        />
      </div>
      <div className="space-y-2">
        <Label>Vai trò</Label>
        <Select value={roleId} onValueChange={setRoleId}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn vai trò" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Trạng thái</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as UserStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
            <SelectItem value="INACTIVE">INACTIVE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || !roleId} className="font-semibold">
          {pending ? "Đang lưu..." : "Lưu"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/users")}>
          Hủy
        </Button>
      </div>
    </form>
  );
}
