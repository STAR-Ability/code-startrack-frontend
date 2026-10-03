import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { mobile } from "./helpers";

function Example({ loading = false, disabled = false, long = false }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button disabled={disabled} />}>
        Review changes
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review training preferences</DialogTitle>
          <DialogDescription>
            This is a local component example. No account changes are sent.
          </DialogDescription>
        </DialogHeader>
        {long ? (
          Array.from({ length: 12 }, (_, i) => (
            <p key={i}>
              Section {i + 1}: dialog content stays within the viewport and
              scrolls on smaller screens.
            </p>
          ))
        ) : (
          <p>
            Focus stays inside the dialog. Escape closes it and returns focus to
            the trigger.
          </p>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button disabled={loading} aria-busy={loading}>
            {loading && <Spinner aria-hidden="true" />}
            {loading ? "Saving…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
const meta = {
  title: "Primitives/Dialog",
  component: Example,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Base UI modal with localized close labels, focus trapping, Escape dismissal and constrained scrolling. Pending actions disable the submitting button. Use explicit titles and descriptions.",
      },
    },
  },
} satisfies Meta<typeof Example>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Scrollable: Story = { args: { long: true } };
export const Mobile: Story = { globals: mobile, args: { long: true } };
