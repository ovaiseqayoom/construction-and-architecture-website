import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { Check, Copy } from "lucide-react";
import MermaidDiagram from "./MermaidDiagram";
import ChartDiagram from "./ChartDiagram";
import { slugifyHeading } from "../../utils/blog";
import styles from "./ArticleContent.module.css";

function sanitizeHref(rawHref = "") {
  const trimmed = String(rawHref || "").trim();
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) {
    return trimmed;
  }
  return "#";
}

function stripInlineFormatting(text = "") {
  return String(text || "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .trim();
}

function parseInline(text, keyPrefix = "") {
  if (!text) return [text];
  const regex = /\*\*(.+?)\*\*|__(.+?)__|~~(.+?)~~|\*([^*]+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
  const result = [];
  let last = 0;
  let count = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      result.push(text.slice(last, match.index));
    }

    const key = `${keyPrefix}-il-${count++}`;

    if (match[1] !== undefined || match[2] !== undefined) {
      const inner = match[1] ?? match[2];
      result.push(
        <strong key={key} className={styles.inlineStrong}>
          {parseInline(inner, `${key}-b`)}
        </strong>
      );
    } else if (match[3] !== undefined) {
      result.push(
        <del key={key} className={styles.inlineStrike}>
          {match[3]}
        </del>
      );
    } else if (match[4] !== undefined) {
      result.push(
        <em key={key} className={styles.inlineEm}>
          {match[4]}
        </em>
      );
    } else if (match[5] !== undefined) {
      result.push(
        <code key={key} className={styles.inlineCode}>
          {match[5]}
        </code>
      );
    } else if (match[6] !== undefined) {
      const safeHref = sanitizeHref(match[7]);
      const isExternal = /^https?:/i.test(safeHref);
      result.push(
        <a
          key={key}
          href={safeHref}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className={styles.inlineLink}
        >
          {match[6]}
        </a>
      );
    }

    last = regex.lastIndex;
  }

  if (last < text.length) {
    result.push(text.slice(last));
  }

  return result.length ? result : [text];
}

function renderTable(block, idx) {
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|"));
  if (lines.length < 2) return null;

  const sepIdx = lines.findIndex((l) => /^\|[\s\-:|]+\|?$/.test(l));
  if (sepIdx === -1) return null;

  const parseRow = (line) => {
    const cleaned = line.replace(/^\|/, "").replace(/\|$/, "");
    return cleaned.split("|").map((c) => c.trim());
  };

  const headers = parseRow(lines[0]);
  const alignments = parseRow(lines[sepIdx]).map((sep) => {
    if (/^:-+:$/.test(sep)) return "center";
    if (/^-+:$/.test(sep)) return "right";
    return "left";
  });
  const bodyRows = lines.slice(sepIdx + 1).map((line) => {
    const cells = parseRow(line);
    while (cells.length < headers.length) cells.push("");
    return cells.slice(0, headers.length);
  });

  return (
    <div key={`tbl-${idx}`} className={styles.tableWrapper}>
      <table className={styles.articleTable}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={`th-${idx}-${i}`} style={{ textAlign: alignments[i] || "left" }}>
                {parseInline(h, `th-${idx}-${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((cells, ri) => (
            <tr key={`tr-${idx}-${ri}`}>
              {cells.map((cell, ci) => (
                <td key={`td-${idx}-${ri}-${ci}`} style={{ textAlign: alignments[ci] || "left" }}>
                  {parseInline(cell, `td-${idx}-${ri}-${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderUnorderedList(lines, idx) {
  const groups = [];
  for (const line of lines) {
    const nestedMatch = line.match(/^(\s{2,})(?:[-*+]|\d+\.)\s+(.*)$/);
    if (nestedMatch && groups.length > 0) {
      groups[groups.length - 1].children.push(nestedMatch[2]);
      continue;
    }
    const topMatch = line.match(/^[-*+]\s+(.*)$/);
    if (topMatch) {
      groups.push({ text: topMatch[1], children: [] });
    } else if (groups.length > 0) {
      groups[groups.length - 1].text += ` ${line.trim()}`;
    }
  }

  return (
    <ul key={idx} className={styles.articleUl}>
      {groups.map((item, i) => {
        const isChecked = item.text.startsWith("[x] ") || item.text.startsWith("[X] ");
        const isUnchecked = item.text.startsWith("[ ] ");
        const isCheckbox = isChecked || isUnchecked;
        const text = isCheckbox ? item.text.slice(4) : item.text;

        return (
          <li key={i} className={styles.articleLi}>
            {isCheckbox ? (
              <span className={`${styles.checkboxBox} ${isChecked ? styles.checkboxChecked : ""}`}>
                {isChecked && <Check size={10} />}
              </span>
            ) : (
              <span className={styles.bulletDot} />
            )}
            <div className={styles.liBody}>
              <span className={styles.liText}>{parseInline(text, `ul-${idx}-${i}`)}</span>
              {item.children.length > 0 && (
                <ul className={styles.articleSubUl}>
                  {item.children.map((sub, si) => (
                    <li key={si} className={styles.articleSubLi}>
                      <span className={styles.subBulletDot} />
                      <span className={styles.liText}>{parseInline(sub, `ul-${idx}-${i}-sub-${si}`)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function renderOrderedList(lines, idx) {
  const groups = [];
  for (const line of lines) {
    const nestedMatch = line.match(/^(\s{2,})(?:[-*+]|\d+\.)\s+(.*)$/);
    if (nestedMatch && groups.length > 0) {
      groups[groups.length - 1].children.push(nestedMatch[2]);
      continue;
    }
    const topMatch = line.match(/^\d+\.\s+(.*)$/);
    if (topMatch) {
      groups.push({ text: topMatch[1], children: [] });
    } else if (groups.length > 0) {
      groups[groups.length - 1].text += ` ${line.trim()}`;
    }
  }

  return (
    <ol key={idx} className={styles.articleOl}>
      {groups.map((item, i) => (
        <li key={i} className={styles.articleOlItem}>
          <span className={styles.numberBadge}>{i + 1}</span>
          <div className={styles.liBody}>
            <span className={styles.olText}>{parseInline(item.text, `ol-${idx}-${i}`)}</span>
            {item.children.length > 0 && (
              <ul className={styles.articleSubUl}>
                {item.children.map((sub, si) => (
                  <li key={si} className={styles.articleSubLi}>
                    <span className={styles.subBulletDot} />
                    <span className={styles.olText}>{parseInline(sub, `ol-${idx}-${i}-sub-${si}`)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

const CodeBlock = memo(({ code, language = "" }) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [code]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className={styles.codeBlockWrapper}>
      <div className={styles.codeBlockHeader}>
        <div className={styles.codeHeaderLeft}>
          <span className={styles.codeLangBadge}>{language ? language.toUpperCase() : "Snippet"}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={styles.copyBtn}
          title="Copy code"
        >
          {copied ? <Check size={12} className={styles.checkIcon} /> : <Copy size={12} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className={styles.codePre}>
        <code>{code}</code>
      </pre>
    </div>
  );
});
CodeBlock.displayName = "CodeBlock";

export default function ArticleContent({ content = "" }) {
  if (!content) return null;

  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const codeBlocks = [];
  const CODE_FENCE_RE = /```[\s\S]*?```|\{%-?\s*mermaid\s*-?%\}[\s\S]*?\{%-?\s*endmermaid\s*-?%\}/g;

  const withPlaceholders = normalized.replace(CODE_FENCE_RE, (match) => {
    const isMermaid =
      /^```mermaid\b/i.test(match) || /^\{%-?\s*mermaid/i.test(match);
    const isChart = /^```chart\b/i.test(match);
    const blockType = isMermaid ? "mermaid" : isChart ? "chart" : "code";
    codeBlocks.push({ type: blockType, raw: match });
    return `\n\n__CODE_BLOCK_${codeBlocks.length - 1}__\n\n`;
  });

  const processedContent = withPlaceholders
    .replace(/([^\n])\n(#{1,6} )/g, "$1\n\n$2")
    .replace(/(#{1,6} [^\n]+)\n([^\n])/g, "$1\n\n$2")
    .replace(/([^\n>])\n(> )/g, "$1\n\n$2")
    .replace(/([^\n])\n(\*\*\*|---|___)/g, "$1\n\n$2")
    .replace(/(\*\*\*|---|___)\n([^\n])/g, "$1\n\n$2")
    .replace(/([^\n|])\n(\|[^\n]+\|\n\|[\s\-:|]+\|)/g, "$1\n\n$2");

  let pCount = 0;

  return (
    <div className={styles.articleBodyContainer}>
      {processedContent.split(/\n{2,}/).map((rawBlock, idx) => {
        const block = rawBlock.trim();
        if (!block) return null;

        if (/^(\*\*\*|---|___)\s*$/.test(block)) {
          return <hr key={idx} className={styles.articleHr} />;
        }

        if (block.startsWith("|") && /\n\|[\s\-:|]+\|/.test(block)) {
          return renderTable(block, idx);
        }

        const headingMatch = block.match(/^(#{1,5})\s+([\s\S]+)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const rawTitle = headingMatch[2].replace(/\n+/g, " ").trim();
          const plainTitle = stripInlineFormatting(rawTitle);
          const id = slugifyHeading(plainTitle);

          if (level <= 2) {
            return (
              <h2 key={idx} id={id} className={styles.articleH2}>
                {parseInline(rawTitle, `h2-${idx}`)}
              </h2>
            );
          }
          if (level === 3) {
            return (
              <h3 key={idx} id={id} className={styles.articleH3}>
                {parseInline(rawTitle, `h3-${idx}`)}
              </h3>
            );
          }
          return (
            <h4 key={idx} id={id} className={styles.articleH4}>
              {parseInline(rawTitle, `h4-${idx}`)}
            </h4>
          );
        }

        if (block.startsWith(">")) {
          const quoteLines = block
            .split("\n")
            .map((line) => line.replace(/^>\s?/, "").trim())
            .filter(Boolean);
          const joinedQuote = quoteLines.join(" ");
          const calloutMatch = joinedQuote.match(/^\*\*(Warning|Caution|Important|Note|Engineering Tip|Tip):\*\*/i);
          const tone = calloutMatch ? calloutMatch[1].toLowerCase() : "";
          const blockquoteToneClass =
            tone === "warning" || tone === "caution"
              ? styles.blockquoteWarning
              : tone === "note" || tone === "important" || tone === "tip" || tone === "engineering tip"
                ? styles.blockquoteInfo
                : "";

          return (
            <blockquote key={idx} className={`${styles.articleBlockquote} ${blockquoteToneClass}`}>
              {quoteLines.map((qLine, qi) => (
                <p key={qi} className={styles.blockquoteText}>
                  {parseInline(qLine, `bq-${idx}-${qi}`)}
                </p>
              ))}
            </blockquote>
          );
        }

        if (/^[-*+]\s+/.test(block)) {
          return renderUnorderedList(block.split("\n"), idx);
        }

        if (/^\d+\.\s+/.test(block)) {
          return renderOrderedList(block.split("\n"), idx);
        }

        const codeMatch = block.match(/^__CODE_BLOCK_(\d+)__$/);
        if (codeMatch) {
          const entry = codeBlocks[Number(codeMatch[1])];

          if (entry.type === "mermaid") {
            const raw = entry.raw
              .replace(/^```mermaid\s*/i, "")
              .replace(/\s*```$/, "")
              .replace(/^\{%-?\s*mermaid\s*-?%\}\s*/i, "")
              .replace(/\s*\{%-?\s*endmermaid\s*-?%\}$/i, "");
            return (
              <MermaidDiagram
                key={`mermaid-${idx}`}
                code={raw}
                id={`diag_${idx}`}
              />
            );
          }

          if (entry.type === "chart") {
            return <ChartDiagram key={`chart-${idx}`} rawJson={entry.raw} />;
          }

          const langMatch = entry.raw.match(/^```([a-zA-Z0-9_-]*)\n?/);
          const lang = langMatch ? langMatch[1] : "";
          const code = entry.raw
            .replace(/^```[a-zA-Z0-9_-]*\n?/, "")
            .replace(/\n?```$/, "");
          return <CodeBlock key={`code-${idx}`} code={code} language={lang} />;
        }

        if (block.startsWith("![")) {
          const match = block.match(/!\[([^\]]*)\]\(([^)]+)\)/);
          if (match) {
            return (
              <figure key={idx} className={styles.articleFigure}>
                <img
                  src={sanitizeHref(match[2])}
                  alt={match[1]}
                  loading="lazy"
                  decoding="async"
                  className={styles.figureImg}
                />
                {match[1] && (
                  <figcaption className={styles.figcaption}>
                    {match[1]}
                  </figcaption>
                )}
              </figure>
            );
          }
        }

        pCount++;
        return (
          <p
            key={idx}
            className={`${styles.articleParagraph} ${pCount === 1 ? styles.firstParagraph : ""}`}
          >
            {parseInline(block.replace(/\n+/g, " "), `p-${idx}`)}
          </p>
        );
      })}
    </div>
  );
}
