"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  deleteNewsletterAction,
  unsubscribeNewsletterAction,
} from "@/features/newsletter/actions";

export function NewsletterRowActions({
  id,
  email,
  canDelete,
  isActive,
}: {
  id: string;
  email: string;
  canDelete: boolean;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!canDelete) return null;

  return (
    <div className="flex justify-end gap-2">
      {isActive ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await unsubscribeNewsletterAction(id);
              if (!result.ok) {
                toast.error(result.message || "Không hủy được đăng ký.");
                return;
              }
              toast.success(`Đã hủy đăng ký ${email}`);
              router.refresh();
            });
          }}
        >
          Hủy đăng ký
        </Button>
      ) : null}
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Xóa vĩnh viễn ${email}?`)) return;
          startTransition(async () => {
            const result = await deleteNewsletterAction(id);
            if (!result.ok) {
              toast.error(result.message || "Không xóa được.");
              return;
            }
            toast.success("Đã xóa subscriber.");
            router.refresh();
          });
        }}
      >
        Xóa
      </Button>
    </div>
  );
}
