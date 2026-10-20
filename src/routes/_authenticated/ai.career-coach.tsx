import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MessageSquare, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  askCareerCoach,
  getCoachConversation,
  listCoachConversations,
} from "@/lib/ai-coach.functions";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ai/career-coach")({
  head: () => ({
    meta: [
      { title: "AI Career Coach — Career Connect" },
      {
        name: "description",
        content:
          "Ask the AI career coach for guidance grounded in your own skills, projects and applications.",
      },
      { property: "og:title", content: "AI Career Coach — Career Connect" },
      {
        property: "og:description",
        content: "Personalised career guidance grounded in your Career Connect profile.",
      },
    ],
  }),
  component: CareerCoachPage,
});

type CoachReply = {
  answer: string;
  nextSteps: string[];
  suggestedFollowUps: string[];
};

type Turn = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Which of my skills are holding me back for my target role?",
  "How should I prepare for interviews over the next month?",
  "Is my application activity on track for placement season?",
];

function CareerCoachPage() {
  const queryClient = useQueryClient();
  const ask = useServerFn(askCareerCoach);
  const loadConversations = useServerFn(listCoachConversations);
  const loadMessages = useServerFn(getCoachConversation);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [reply, setReply] = useState<CoachReply | null>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ["ai", "coach", "conversations"],
    queryFn: () => loadConversations({ data: undefined }),
  });

  const openThread = useMutation({
    mutationFn: (id: string) => loadMessages({ data: { conversationId: id } }),
    onSuccess: (messages, id) => {
      setConversationId(id);
      setReply(null);
      setTurns(
        messages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      );
    },
    onError: () => toast.error("That conversation could not be opened."),
  });

  const send = useMutation({
    mutationFn: async (text: string) => ask({ data: { conversationId, message: text } }),
    onMutate: (text) => {
      setTurns((prev) => [...prev, { role: "user", content: text }]);
      setReply(null);
      setMessage("");
    },
    onSuccess: (result) => {
      setConversationId(result.conversationId);
      setReply(result.reply);
      setTurns((prev) => [...prev, { role: "assistant", content: result.reply.answer }]);
      queryClient.invalidateQueries({ queryKey: ["ai", "coach", "conversations"] });
    },
    onError: (error: Error) => {
      setTurns((prev) => prev.slice(0, -1));
      toast.error(error.message || "The coach could not answer that.");
    },
  });

  function submit(text: string) {
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      toast.error("Ask a slightly longer question.");
      return;
    }
    send.mutate(trimmed);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="AI intelligence"
        title="AI career coach"
        description="Guidance grounded in your real profile — your skills, target career, projects and applications."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              setConversationId(null);
              setTurns([]);
              setReply(null);
            }}
          >
            New conversation
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Saved conversations
          </p>
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => openThread.mutate(c.id)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                  conversationId === c.id && "border-primary bg-accent",
                )}
              >
                <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2">{c.title}</span>
              </button>
            ))
          )}
        </aside>

        <section className="space-y-4">
          <div className="min-h-64 space-y-4 rounded-xl border border-border bg-card p-5">
            {turns.length === 0 ? (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  <Sparkles className="size-4 text-primary" />
                  Ask anything about your career path.
                </p>
                <div className="flex flex-wrap gap-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => submit(s)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:bg-accent"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              turns.map((turn, index) => (
                <div
                  key={`${turn.role}-${index}`}
                  className={cn(
                    "max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed",
                    turn.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {turn.content}
                </div>
              ))
            )}

            {send.isPending ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Thinking about your profile…
              </p>
            ) : null}
          </div>

          {reply ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Next steps
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {reply.nextSteps.map((step) => (
                    <li key={step} className="flex gap-2">
                      <span className="text-primary">→</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ask next
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {reply.suggestedFollowUps.map((q) => (
                    <Badge
                      key={q}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => submit(q)}
                    >
                      {q}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <form
            className="flex items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              submit(message);
            }}
          >
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask your career coach…"
              rows={3}
              className="resize-none"
            />
            <Button type="submit" disabled={send.isPending}>
              {send.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Send
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
