import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MailIcon, LockKeyholeIcon } from "lucide-react";
import { FormInput } from "@/components/ui/form-input";
import { FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StoryFrame, mobile } from "./helpers";

const schema = z.object({ email: z.email("Enter a valid email address.") });
function ValidatedForm() {
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });
  return (
    <form
      className="flex max-w-md flex-col gap-4"
      noValidate
      onSubmit={handleSubmit(() => setSaved(true))}
    >
      <FormInput
        label="Email"
        type="email"
        autoComplete="off"
        icon={MailIcon}
        error={errors.email?.message}
        {...register("email")}
      />
      <Button type="submit">Validate locally</Button>
      {saved && <p role="status">Valid input. No request was sent.</p>}
    </form>
  );
}
const meta = {
  title: "Primitives/Form",
  component: FormInput,
  decorators: [
    (Story) => (
      <StoryFrame>
        <div className="w-full max-w-md">
          <Story />
        </div>
      </StoryFrame>
    ),
  ],
  args: {
    label: "Email",
    type: "email",
    icon: MailIcon,
    placeholder: "you@example.invalid",
    hint: "Synthetic input; this story does not send email.",
  },
  parameters: {
    docs: {
      description: {
        component:
          "The shared production FormInput owns label association, described errors, hints, icons and password visibility. Non-trivial forms compose it with React Hook Form and Zod. API submission remains in feature containers.",
      },
    },
  },
} satisfies Meta<typeof FormInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Error: Story = {
  args: { defaultValue: "invalid", error: "Enter a valid email address." },
};
export const Disabled: Story = {
  args: { disabled: true, defaultValue: "demo@example.invalid" },
};
export const Password: Story = {
  args: {
    label: "Password",
    type: "password",
    icon: LockKeyholeIcon,
    defaultValue: "synthetic-password",
    placeholder: undefined,
    hint: "Use the visibility control without submitting the form.",
    autoComplete: "off",
  },
};
export const Loading: Story = {
  render: (args) => (
    <FieldGroup>
      <FormInput {...args} disabled />
      <Button disabled aria-busy="true">
        <Spinner aria-hidden="true" /> Saving…
      </Button>
    </FieldGroup>
  ),
};
export const Validation: Story = { render: () => <ValidatedForm /> };
export const Mobile: Story = { globals: mobile };
