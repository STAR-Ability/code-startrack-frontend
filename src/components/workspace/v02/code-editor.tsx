"use client";

import {
  Component,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import dynamic from "next/dynamic";
import {
  EditorState,
  EditorView,
  type ReactCodeMirrorRef,
} from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { undo, redo } from "@codemirror/commands";
import { openSearchPanel } from "@codemirror/search";
import {
  DownloadIcon,
  Redo2Icon,
  SearchIcon,
  Settings2Icon,
  Undo2Icon,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/components/layout/locale-provider";
import { SOURCE_BYTE_LIMIT, sourceByteCount } from "./problem-state";

function EditorLoading() {
  const { t } = useLocale();
  return (
    <p role="status" className="p-4 text-sm">
      {t("v02.problem.loadingEditor")}
    </p>
  );
}
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
  loading: EditorLoading,
});
export type CodeEditorHandle = { focus: () => void };

const sourceHighlighting = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.keyword, color: "#d8b4fe" },
    { tag: [tags.name, tags.deleted], color: "#f28b96" },
    { tag: [tags.character, tags.string], color: "#aad59b" },
    { tag: [tags.number, tags.bool, tags.typeName], color: "#f4c87a" },
    {
      tag: [tags.function(tags.variableName), tags.propertyName],
      color: "#91c7ff",
    },
    { tag: [tags.operator, tags.punctuation], color: "#c7d5e8" },
    { tag: [tags.comment, tags.meta], color: "#9cabc2" },
    { tag: tags.invalid, color: "#f28b96", textDecoration: "underline" },
  ]),
);

// Keep an accessible editing surface if the editor chunk fails to load.
class EditorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function CodeEditor({
  source,
  onChange,
  filename,
  languageId,
  languageFamily,
  error,
  disabled = false,
  inputRef,
}: {
  source: string;
  onChange: (source: string) => void;
  filename: string;
  languageId?: string;
  languageFamily?: string;
  error?: string;
  disabled?: boolean;
  inputRef?: Ref<CodeEditorHandle>;
}) {
  const id = useId();
  const { t } = useLocale();
  const mirror = useRef<ReactCodeMirrorRef>(null);
  const plainInput = useRef<HTMLTextAreaElement>(null);
  const [plain, setPlain] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [fontSize, setFontSize] = useState("14");
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  useImperativeHandle(inputRef, () => ({
    focus: () => {
      if (plainInput.current) plainInput.current.focus();
      else mirror.current?.view?.focus();
    },
  }));
  const extensions = useMemo(
    () => [
      sourceHighlighting,
      EditorState.phrases.of({
        Find: t("v02.problem.find"),
        Replace: t("v02.problem.replace"),
        next: t("v02.problem.nextMatch"),
        previous: t("v02.problem.previousMatch"),
        all: t("v12.all"),
        "match case": t("v02.problem.matchCase"),
        regexp: t("v02.problem.regexp"),
        "by word": t("v02.problem.wholeWord"),
        replace: t("v02.problem.replace"),
        "replace all": t("v02.problem.replaceAll"),
        close: t("ui.close"),
        "current match": t("v02.problem.currentMatch"),
        "on line": t("v02.problem.onLine"),
      }),
      ...(languageFamily === "C" ||
      languageFamily === "C++" ||
      /\.(c|cpp|cc|h)$/.test(filename)
        ? [cpp()]
        : []),
      ...(wrap ? [EditorView.lineWrapping] : []),
      EditorView.contentAttributes.of({
        "aria-label": t("v02.problem.sourceCode"),
        "aria-describedby": `${id}-hint${error ? ` ${id}-error` : ""}`,
        "aria-invalid": String(!!error),
        "aria-multiline": "true",
        role: "textbox",
        spellcheck: "false",
        translate: "no",
      }),
      EditorView.theme(
        {
          "&": {
            height: "100%",
            fontSize: `${fontSize}px`,
            backgroundColor: "var(--code-canvas)",
            color: "var(--code-foreground)",
          },
          ".cm-scroller": {
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            lineHeight: "1.8",
            overflow: "auto",
          },
          ".cm-content": {
            padding: "16px 0",
            minHeight: "100%",
            caretColor: "#9bbaff",
          },
          ".cm-line": { padding: "0 20px 0 12px" },
          ".cm-gutters": {
            backgroundColor: "var(--code-canvas)",
            border: "none",
            color: "var(--code-muted)",
          },
          ".cm-gutterElement": { padding: "0 12px 0 14px" },
          ".cm-activeLine, .cm-activeLineGutter": {
            backgroundColor: "#9bbaff0d",
          },
          "&.cm-focused": {
            outline: "2px solid var(--ring)",
            outlineOffset: "-2px",
          },
          ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
            backgroundColor: "#49679066",
          },
          ".cm-cursor": { borderLeftColor: "#9bbaff" },
          ".cm-placeholder": { color: "#9cabc2" },
          ".cm-tooltip": {
            backgroundColor: "#202c40",
            borderColor: "#64748b",
            color: "#edf3ff",
          },
          ".cm-tooltip-autocomplete ul li[aria-selected]": {
            backgroundColor: "#345178",
            color: "#ffffff",
          },
          ".cm-search": {
            padding: "8px",
            backgroundColor: "#202c40",
            color: "#edf3ff",
          },
          ".cm-search input, .cm-search button": {
            border: "1px solid #64748b",
            borderRadius: "4px",
            padding: "2px 6px",
            backgroundColor: "#152033",
            color: "#edf3ff",
          },
        },
        { dark: true },
      ),
    ],
    [languageFamily, filename, wrap, fontSize, t, id, error],
  );

  function download() {
    const url = URL.createObjectURL(
      new Blob([source], { type: "text/plain;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename || "source.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  const textarea = (
    <Textarea
      ref={plainInput}
      id={id}
      name="sourceCode"
      aria-label={t("v02.problem.sourceCode")}
      translate="no"
      aria-invalid={!!error}
      aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
      value={source}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      autoComplete="off"
      dir="ltr"
      wrap={wrap ? "soft" : "off"}
      className="code-plain-input"
      style={{ fontSize: `${fontSize}px` }}
    />
  );

  return (
    <Field
      className="code-editor-field"
      data-invalid={!!error}
      data-disabled={disabled}
    >
      <div className="code-file-toolbar">
        <div className="code-file-tab">
          <span aria-hidden="true" className="code-file-mark">
            {"</>"}
          </span>
          <FieldLabel htmlFor={plain ? id : undefined} className="sr-only">
            {t("v02.problem.sourceCode")}
          </FieldLabel>
          <code>{filename}</code>
        </div>
        <div
          className="flex min-w-0 max-w-full flex-wrap items-center gap-1"
          role="group"
          aria-label={t("v02.problem.sourceCode")}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title={t("v02.problem.undo")}
            aria-label={t("v02.problem.undo")}
            disabled={plain || disabled}
            onClick={() => mirror.current?.view && undo(mirror.current.view)}
          >
            <Undo2Icon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title={t("v02.problem.redo")}
            aria-label={t("v02.problem.redo")}
            disabled={plain || disabled}
            onClick={() => mirror.current?.view && redo(mirror.current.view)}
          >
            <Redo2Icon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title={t("v02.problem.find")}
            aria-label={t("v02.problem.find")}
            disabled={plain}
            onClick={() =>
              mirror.current?.view && openSearchPanel(mirror.current.view)
            }
          >
            <SearchIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title={t("v02.problem.download")}
            aria-label={t("v02.problem.download")}
            onClick={download}
            disabled={!source}
          >
            <DownloadIcon />
          </Button>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("v02.problem.settings")}
                  title={t("v02.problem.settings")}
                />
              }
            >
              <Settings2Icon />
            </PopoverTrigger>
            <PopoverContent align="end">
              <PopoverTitle>{t("v02.problem.settings")}</PopoverTitle>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor={`${id}-font`}>
                    {t("v02.problem.fontSize")}
                  </FieldLabel>
                  <NativeSelect
                    id={`${id}-font`}
                    value={fontSize}
                    onChange={(event) => setFontSize(event.target.value)}
                  >
                    {[12, 14, 16, 18].map((size) => (
                      <NativeSelectOption key={size} value={size}>
                        {size} px
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel
                    htmlFor={`${id}-wrap`}
                    className="flex items-center gap-2"
                  >
                    <input
                      id={`${id}-wrap`}
                      type="checkbox"
                      checked={wrap}
                      onChange={(event) => setWrap(event.target.checked)}
                    />
                    {t("v02.problem.wrap")}
                  </FieldLabel>
                </Field>
              </FieldGroup>
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            wrap
            aria-pressed={plain}
            onClick={() => setPlain(!plain)}
          >
            {t(plain ? "v02.problem.richEditor" : "v02.problem.plainText")}
          </Button>
        </div>
      </div>
      <div className="code-editor-canvas" data-testid="code-editor-canvas">
        {plain ? (
          textarea
        ) : (
          <EditorBoundary
            fallback={
              <div className="code-editor-fallback">
                <Alert>
                  <AlertDescription>
                    {t("v02.problem.editorFallback")}
                  </AlertDescription>
                </Alert>
                {textarea}
              </div>
            }
          >
            <CodeMirror
              key={languageId ?? filename}
              className="code-mirror-container"
              ref={mirror}
              value={source}
              height="100%"
              theme="none"
              extensions={extensions}
              editable={!disabled}
              readOnly={disabled}
              indentWithTab={false}
              placeholder={t("v02.problem.placeholder")}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                autocompletion: true,
                highlightActiveLine: true,
                tabSize: 2,
              }}
              onChange={onChange}
              onCreateEditor={() => setCursor({ line: 1, column: 1 })}
              onUpdate={(update) => {
                if (!update.selectionSet && !update.docChanged) return;
                const position = update.state.selection.main.head;
                const line = update.state.doc.lineAt(position);
                setCursor({
                  line: line.number,
                  column: position - line.from + 1,
                });
              }}
            />
          </EditorBoundary>
        )}
      </div>
      <div className="code-status-bar">
        <span>
          {plain
            ? t("v02.problem.lines", {
                count: String(source.split("\n").length),
              })
            : t("v02.problem.cursor", {
                line: String(cursor.line),
                column: String(cursor.column),
              })}
        </span>
        <span>
          {t("v02.problem.byteCount", {
            count: String(sourceByteCount(source)),
            limit: String(SOURCE_BYTE_LIMIT),
          })}
        </span>
        <span>UTF-8</span>
      </div>
      <FieldDescription id={`${id}-hint`} className="code-keyboard-hint">
        {t("v02.problem.keyboardHint")}
      </FieldDescription>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="px-4 pb-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </Field>
  );
}
