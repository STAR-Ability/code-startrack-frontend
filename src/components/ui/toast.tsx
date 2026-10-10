"use client";

import * as React from "react";
import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { cn } from "cn";

import { useLocale } from "@/components/layout/locale-provider";

import { Button } from "@/components/ui/button";
import {
  XIcon,
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const toast = ToastPrimitive.createToastManager();

function ToastProvider({ ...props }: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />;
}

function ToastPortal({ ...props }: ToastPrimitive.Portal.Props) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />;
}

function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "pointer-events-none fixed inset-x-4 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-50 mx-auto w-auto max-w-md outline-none sm:right-5 sm:left-auto sm:w-[calc(100%-2.5rem)]",
        className,
      )}
      {...props}
    />
  );
}

function Toast({
  className,
  onClickCapture,
  onKeyDownCapture,
  ...props
}: ToastPrimitive.Root.Props) {
  function restoreFocusAfterKeyboardDismissal(root: HTMLElement) {
    const document = root.ownerDocument;
    const viewport = root.closest<HTMLElement>('[data-slot="toast-viewport"]');
    if (!viewport || !root.contains(document.activeElement)) return;

    // The primitive can focus a queued toast before React removes its inert state.
    requestAnimationFrame(() => {
      if (!viewport.isConnected || !root.hasAttribute("data-ending-style"))
        return;
      const focused = document.activeElement;
      if (focused !== document.body && !root.contains(focused)) return;
      viewport
        .querySelector<HTMLElement>(
          '[data-slot="toast"]:not([data-ending-style]):not([data-limited]):not([inert])',
        )
        ?.focus({ preventScroll: true });
    });
  }

  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        "group/toast pointer-events-auto absolute right-0 bottom-0 z-[calc(1000-var(--toast-index))] w-full origin-bottom rounded-2xl border bg-popover text-popover-foreground shadow-lg will-change-transform outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]",
        "h-(--height) [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] [transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms]",
        "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
        "data-expanded:h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]",
        "data-limited:opacity-0 data-starting-style:[transform:translateY(150%)]",
        "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(150%)]",
        "data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        "data-expanded:data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-expanded:data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        className,
      )}
      {...props}
      onClickCapture={(event) => {
        onClickCapture?.(event);
        if (event.detail === 0)
          restoreFocusAfterKeyboardDismissal(event.currentTarget);
      }}
      onKeyDownCapture={(event) => {
        onKeyDownCapture?.(event);
        if (event.key === "Escape")
          restoreFocusAfterKeyboardDismissal(event.currentTarget);
      }}
    />
  );
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        "grid max-h-[40dvh] grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_minmax(0,1fr)] items-center gap-3 overflow-hidden p-4 transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-behind:opacity-0 data-expanded:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  );
}

function ToastDescription({
  className,
  ...props
}: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function ToastAction({
  className,
  render = <Button variant="outline" size="sm" />,
  ...props
}: ToastPrimitive.Action.Props) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={cn(
        "mt-2 h-auto w-full min-w-0 shrink-0 py-2 wrap-anywhere whitespace-normal",
        className,
      )}
      {...props}
    />
  );
}

function ToastClose({
  className,
  children,
  render = <Button variant="ghost" size="icon-sm" />,
  ...props
}: ToastPrimitive.Close.Props) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Close toast"
      render={render}
      className={cn(
        "relative col-start-2 row-start-1 shrink-0 text-muted-foreground after:absolute after:-inset-2 after:content-[''] hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children ?? <XIcon aria-hidden="true" />}
    </ToastPrimitive.Close>
  );
}

function ToastIcon({ type }: { type: string | undefined }) {
  let icon: React.ReactNode = null;

  if (type === "success") {
    icon = <CircleCheckIcon aria-hidden="true" />;
  }

  if (type === "info") {
    icon = <InfoIcon aria-hidden="true" />;
  }

  if (type === "warning") {
    icon = <TriangleAlertIcon aria-hidden="true" />;
  }

  if (type === "error") {
    icon = <OctagonXIcon className="text-destructive" aria-hidden="true" />;
  }

  if (type === "loading") {
    icon = <Loader2Icon className="animate-spin" aria-hidden="true" />;
  }

  if (!icon) {
    return null;
  }

  return (
    <span
      data-slot="toast-icon"
      className="col-start-1 row-start-1 shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"
    >
      {icon}
    </span>
  );
}

function ToastMessage({ updateKey }: { updateKey: number }) {
  const message = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = message.current;
    if (!element) return;
    const updateScrollBoundary = () => {
      const scrollable = element.scrollHeight > element.clientHeight;
      // Let long notices scroll without triggering the primitive's swipe gesture.
      element.toggleAttribute("data-base-ui-swipe-ignore", scrollable);
      if (scrollable) element.setAttribute("tabindex", "0");
      else element.removeAttribute("tabindex");
    };
    updateScrollBoundary();
    const observer = new ResizeObserver(updateScrollBoundary);
    observer.observe(element);
    for (const child of element.children) observer.observe(child);
    return () => observer.disconnect();
  }, [updateKey]);

  return (
    <div
      ref={message}
      data-slot="toast-message"
      className="col-span-2 col-start-1 row-start-2 flex min-h-0 min-w-0 flex-1 flex-col gap-1 self-stretch overflow-y-auto overscroll-contain wrap-anywhere outline-none focus-visible:ring-2 focus-visible:ring-ring *:shrink-0"
    >
      <ToastTitle />
      <ToastDescription />
      <ToastAction />
    </div>
  );
}

function ToastList() {
  const { t } = useLocale();
  const { toasts } = ToastPrimitive.useToastManager();

  return toasts.map((toastItem) => (
    <Toast key={toastItem.id} toast={toastItem}>
      <ToastContent>
        <ToastIcon type={toastItem.type} />
        <ToastMessage updateKey={toastItem.updateKey ?? 0} />
        <ToastClose aria-label={t("ui.dismiss")} />
      </ToastContent>
    </Toast>
  ));
}

function Toaster({
  children,
  toastManager = toast,
  limit = 1,
  ...props
}: ToastPrimitive.Provider.Props) {
  const { t } = useLocale();
  return (
    <ToastProvider toastManager={toastManager} limit={limit} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport aria-label={t("ui.notifications")}>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  );
}

const createToastManager = ToastPrimitive.createToastManager;
const useToastManager = ToastPrimitive.useToastManager;

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
};
