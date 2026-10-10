import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { CodeEditor } from "@/components/workspace/v02/code-editor";
import { ProblemStatement } from "@/components/workspace/v02/problem-statement";
import { v02Problems, v02SourceCode } from "@/lib/demo/v02-fixtures";
import { StoryFrame, mobile } from "./helpers";

function Editor({
  error,
  disabled = false,
}: {
  error?: string;
  disabled?: boolean;
}) {
  const [source, setSource] = useState(v02SourceCode);
  return (
    <CodeEditor
      source={source}
      onChange={setSource}
      filename="main.cpp"
      error={error}
      disabled={disabled}
    />
  );
}

const meta = {
  title: "Workspace/V02 Problems",
  parameters: {
    docs: {
      description: {
        component:
          "Production safe statement and ephemeral editor composition with synthetic public problem data. Source remains unmodified; compiler capabilities and submission requests are covered by the offline E2E suite.",
      },
    },
  },
  decorators: [
    (Story) => (
      <StoryFrame>
        <Story />
      </StoryFrame>
    ),
  ],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <>
      <ProblemStatement problem={v02Problems[0]} />
      <Editor />
    </>
  ),
};
export const Mobile: Story = { ...Default, globals: mobile };
export const English: Story = { ...Default, globals: { locale: "en" } };
export const EnglishMobile: Story = {
  ...Default,
  globals: { ...mobile, locale: "en" },
};
export const Unrated: Story = {
  render: () => <ProblemStatement problem={v02Problems[1]} />,
};
export const WithdrawnHistory: Story = {
  render: () => <ProblemStatement problem={v02Problems[2]} historical />,
};
export const NoSamples: Story = {
  render: () => (
    <ProblemStatement problem={{ ...v02Problems[0], samples: [] }} />
  ),
};
export const EditorDisabled: Story = { render: () => <Editor disabled /> };
export const EditorValidation: Story = {
  globals: { locale: "en" },
  render: () => (
    <Editor error="Source exceeds the 262144-byte UTF-8 limit. Keep the complete source and reduce it before submitting." />
  ),
};
export const EditUnmodifiedSource: Story = {
  globals: { locale: "en" },
  render: () => <Editor />,
  play: async ({ canvas }) => {
    const source = "  // UTF-8: 中\nint main() { return 0; }  ";
    const editor = await canvas.findByRole("textbox", { name: "Source code" });
    await expect(editor).toHaveAttribute("contenteditable", "true");
    await userEvent.clear(editor);
    await userEvent.paste(source);
    await waitFor(() => expect(editor.innerText).toBe(source));
    await userEvent.click(
      canvas.getByRole("button", { name: "Use plain text editor" }),
    );
    const plain = await canvas.findByRole("textbox", { name: "Source code" });
    await expect(plain).toHaveValue(source);
    await userEvent.click(
      canvas.getByRole("button", { name: "Use code editor" }),
    );
    const restored = await canvas.findByRole("textbox", {
      name: "Source code",
    });
    await expect(restored).toHaveAttribute("contenteditable", "true");
    await waitFor(() => expect(restored.innerText).toBe(source));
  },
};
