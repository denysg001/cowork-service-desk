import * as React from "react";
import { cn } from "../../lib/utils";

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("rounded-md border border-border bg-muted text-foreground shadow-sm", props.className)} />;
}
