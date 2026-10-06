import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Dialog as DialogRoot,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet as SheetRoot,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover as PopoverRoot,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible as CollapsibleRoot,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip as TooltipRoot,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { mobile } from "./helpers";

function DraftNote({ id }: { id: string }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>Draft note</FieldLabel>
      <Input id={id} defaultValue="Review the next training session" />
    </Field>
  );
}

function DialogSpecimen() {
  return (
    <DialogRoot>
      <DialogTrigger render={<Button />}>Open dialog</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review a training note</DialogTitle>
          <DialogDescription>
            Edit locally, then close or reopen this review. No changes are sent.
          </DialogDescription>
        </DialogHeader>
        <DraftNote id="dialog-draft" />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Finish review
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

function SheetSpecimen() {
  return (
    <SheetRoot>
      <SheetTrigger render={<Button />}>Open sheet</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Training notes</SheetTitle>
          <SheetDescription>
            This local draft follows the sheet through interrupted transitions.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <DraftNote id="sheet-draft" />
        </div>
        <SheetClose render={<Button variant="outline" className="mx-4" />}>
          Finish review
        </SheetClose>
      </SheetContent>
    </SheetRoot>
  );
}

function PopoverSpecimen() {
  return (
    <div className="flex flex-wrap gap-3">
      <PopoverRoot>
        <PopoverTrigger render={<Button />}>Open popover</PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Quick training note</PopoverTitle>
            <PopoverDescription>
              Keep a local draft while opening and closing the popup.
            </PopoverDescription>
          </PopoverHeader>
          <DraftNote id="popover-draft" />
        </PopoverContent>
      </PopoverRoot>
      <Button variant="outline">Outside action</Button>
    </div>
  );
}

function CollapsibleSpecimen() {
  return (
    <CollapsibleRoot className="flex w-full max-w-md flex-col gap-3">
      <CollapsibleTrigger render={<Button variant="outline" />}>
        Show training details
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-3 pb-1">
          <p className="text-sm text-muted-foreground">
            Details mount on demand. An interrupted close preserves this draft;
            completing a close releases the content.
          </p>
          <DraftNote id="disclosure-draft" />
        </div>
      </CollapsibleContent>
    </CollapsibleRoot>
  );
}

const trainingOptions = [
  { label: "Balanced training", value: "balanced" },
  { label: "Graph algorithms", value: "graphs" },
  { label: "Unavailable practice", value: "unavailable", disabled: true },
  { label: "Dynamic programming", value: "dynamic" },
];

function SelectSpecimen({ aligned }: { aligned: boolean }) {
  return (
    <Select
      items={trainingOptions}
      defaultValue="balanced"
      name="trainingFocus"
    >
      <SelectTrigger aria-label="Training focus">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={aligned}>
        <SelectGroup>
          {trainingOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function MenuSpecimen() {
  const [selection, setSelection] = useState("No action selected");
  return (
    <div className="flex flex-col gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button />}>
          Training actions
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => setSelection("Recommendations selected")}
            >
              Review recommendations
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelection("Analysis selected")}>
              Review analysis
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <p role="status" className="text-sm text-muted-foreground">
        {selection}
      </p>
    </div>
  );
}

function TooltipSpecimen() {
  return (
    <div className="flex flex-wrap gap-3">
      <TooltipRoot>
        <TooltipTrigger render={<Button variant="outline" />}>
          Training help
        </TooltipTrigger>
        <TooltipContent>Review the next recommended problem.</TooltipContent>
      </TooltipRoot>
      <Button variant="outline">Next control</Button>
    </div>
  );
}

const meta = {
  title: "Primitives/OverlayMotion",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Production overlays and disclosure content with local draft fields. Inspect interrupted transitions, focus return, reduced motion and lazy content without account requests or custom presence logic.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dialog: Story = { render: () => <DialogSpecimen /> };
export const Sheet: Story = { render: () => <SheetSpecimen /> };
export const Popover: Story = { render: () => <PopoverSpecimen /> };
export const Collapsible: Story = { render: () => <CollapsibleSpecimen /> };
export const SelectAligned: Story = {
  render: () => <SelectSpecimen aligned />,
};
export const SelectAnchored: Story = {
  render: () => <SelectSpecimen aligned={false} />,
};
export const Menu: Story = { render: () => <MenuSpecimen /> };
export const Tooltip: Story = { render: () => <TooltipSpecimen /> };
export const Mobile: Story = { ...Dialog, globals: mobile };
