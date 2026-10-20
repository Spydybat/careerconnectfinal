import { useState } from "react";
import { Check, Copy, FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CodeFile } from "../types";

interface CodeViewerProps {
  files: CodeFile[];
}

export function CodeViewer({ files }: CodeViewerProps) {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeFile = files[activeFileIndex] || files[0];

  const handleCopy = async () => {
    if (!activeFile) return;
    await navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!files || files.length === 0 || !activeFile) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
        No source files available for this exercise.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* File Tabs Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {files.map((file, idx) => (
            <button
              key={file.name}
              type="button"
              onClick={() => setActiveFileIndex(idx)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono font-medium transition-colors ${
                activeFileIndex === idx
                  ? "bg-background text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              }`}
            >
              <FileCode2 className="size-3.5" />
              {file.name}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy code"}
        </Button>
      </div>

      {activeFile.description && (
        <div className="border-b border-border/60 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
          {activeFile.description}
        </div>
      )}

      {/* Code Content */}
      <div className="max-h-[600px] overflow-auto bg-slate-950 p-4 text-xs font-mono text-slate-100">
        <pre className="leading-relaxed">
          <code>{activeFile.code}</code>
        </pre>
      </div>
    </div>
  );
}
