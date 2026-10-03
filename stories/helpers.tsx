import type { ReactNode } from "react";

export const mobile = { viewport: { value: "mobile", isRotated: false } };

export function StoryFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-4">
      {children}
    </div>
  );
}
