import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FilterSelectOption = { value: string; label: string };

export type FilterField =
  | {
      type: "search";
      name?: string;
      placeholder?: string;
      defaultValue?: string;
      className?: string;
    }
  | {
      type: "select";
      name: string;
      defaultValue?: string;
      options: FilterSelectOption[];
      className?: string;
      "aria-label"?: string;
    }
  | {
      type: "date";
      name: string;
      defaultValue?: string;
      label?: string;
      className?: string;
    };

export const CONTENT_STATUS_FILTER_OPTIONS: FilterSelectOption[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "DRAFT", label: "Nháp" },
  { value: "PUBLISHED", label: "Xuất bản" },
  { value: "ARCHIVED", label: "Lưu trữ" },
];

const controlClass =
  "h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function FilterBar({
  fields,
  submitLabel = "Lọc",
  className,
  hiddenFields,
  children,
}: {
  fields: FilterField[];
  submitLabel?: string;
  className?: string;
  hiddenFields?: Record<string, string>;
  children?: React.ReactNode;
}) {
  return (
    <form
      method="get"
      className={cn("mb-4 flex flex-wrap items-end gap-2", className)}
    >
      {Object.entries(hiddenFields ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {fields.map((field) => {
        if (field.type === "search") {
          return (
            <input
              key={field.name ?? "search"}
              name={field.name ?? "search"}
              defaultValue={field.defaultValue ?? ""}
              placeholder={field.placeholder ?? "Tìm kiếm..."}
              className={cn(controlClass, "w-full max-w-md", field.className)}
            />
          );
        }
        if (field.type === "select") {
          return (
            <select
              key={field.name}
              name={field.name}
              defaultValue={field.defaultValue ?? ""}
              aria-label={field["aria-label"] ?? field.name}
              className={cn(controlClass, field.className)}
            >
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        }
        return (
          <label
            key={field.name}
            className={cn(
              "flex flex-col gap-1 text-xs text-muted-foreground",
              field.className,
            )}
          >
            {field.label ? <span>{field.label}</span> : null}
            <input
              type="date"
              name={field.name}
              defaultValue={field.defaultValue ?? ""}
              className={controlClass}
            />
          </label>
        );
      })}
      <Button type="submit" variant="secondary">
        {submitLabel}
      </Button>
      {children}
    </form>
  );
}
