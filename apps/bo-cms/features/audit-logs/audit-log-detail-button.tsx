"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AUDIT_ACTION_LABELS,
  auditResourceLabel,
} from "@/features/audit-logs/labels";
import { formatDateTime } from "@/lib/utils";
import type { AuditAction } from "@cms/db";

type AuditDetail = {
  id: string;
  action: AuditAction;
  resource: string;
  resourceId: string | null;
  oldValue: unknown;
  newValue: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
};

function prettyJson(value: unknown) {
  if (value == null) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function AuditLogDetailButton({ log }: { log: AuditDetail }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        title="Chi tiết"
        aria-label="Chi tiết"
        onClick={() => setOpen(true)}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {AUDIT_ACTION_LABELS[log.action]} · {auditResourceLabel(log.resource)}
            </DialogTitle>
            <DialogDescription>
              {formatDateTime(log.createdAt)}
              {log.userName ? ` · ${log.userName}` : " · Hệ thống"}
              {log.userEmail ? ` (${log.userEmail})` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <div className="text-muted-foreground">ID bản ghi</div>
              <div className="font-mono text-xs">{log.id}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Resource ID</div>
              <div className="font-mono text-xs">{log.resourceId ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">IP</div>
              <div>{log.ipAddress ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">User agent</div>
              <div className="break-all text-xs">{log.userAgent ?? "—"}</div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-medium">Giá trị cũ</div>
              <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs">
                {prettyJson(log.oldValue)}
              </pre>
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Giá trị mới</div>
              <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs">
                {prettyJson(log.newValue)}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
