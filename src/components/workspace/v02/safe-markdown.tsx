import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Separator } from "@/components/ui/separator";
import { v02ProblemsEn } from "@/lib/i18n/v02-problems-messages";

// The backend owns provenance; statement links remain explicit browser navigation.
export function safeStatementUrl(value: string) {
  if (/[\u0000-\u0020\u007f\\]/.test(value)) return "";
  if (value.startsWith("#")) return value;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

export function SafeMarkdown({
  content,
  codeLabel = v02ProblemsEn["v02.problem.codeBlock"],
  tableLabel = v02ProblemsEn["v02.problem.statementTable"],
}: {
  content: string;
  codeLabel?: string;
  tableLabel?: string;
}) {
  return (
    <div className="min-w-0 text-sm leading-7 wrap-anywhere [&_p]:my-3 [&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold [&_h5]:mt-4 [&_h5]:mb-2 [&_h5]:text-base [&_h5]:font-semibold [&_h6]:mt-3 [&_h6]:mb-2 [&_h6]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_pre]:my-4 [&_pre]:max-w-full [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4 [&_code]:font-mono [&_code]:text-[0.9em]">
      <Markdown
        remarkPlugins={[remarkGfm]}
        urlTransform={safeStatementUrl}
        components={{
          h1: ({ children }) => <h4>{children}</h4>,
          h2: ({ children }) => <h5>{children}</h5>,
          h3: ({ children }) => <h6>{children}</h6>,
          h4: ({ children }) => <h6>{children}</h6>,
          h5: ({ children }) => <h6>{children}</h6>,
          h6: ({ children }) => <h6>{children}</h6>,
          a: ({ href, children }) =>
            href ? (
              <a
                href={href}
                rel="noopener noreferrer"
                className="text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
              >
                {children}
              </a>
            ) : (
              <span>{children}</span>
            ),
          img: ({ src, alt }) =>
            typeof src === "string" && src ? (
              <a
                href={src}
                rel="noopener noreferrer"
                className="text-link underline underline-offset-4"
              >
                {alt || src}
              </a>
            ) : (
              <span>{alt}</span>
            ),
          table: ({ children }) => (
            <div
              tabIndex={0}
              role="region"
              aria-label={tableLabel}
              className="my-4 max-w-full overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <table className="w-full border-collapse text-left text-sm [&_th]:border [&_th]:bg-muted [&_th]:p-2 [&_td]:border [&_td]:p-2">
                {children}
              </table>
            </div>
          ),
          pre: ({ children }) => (
            <pre
              tabIndex={0}
              role="region"
              aria-label={codeLabel}
              className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {children}
            </pre>
          ),
          hr: () => <Separator className="my-5" />,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
