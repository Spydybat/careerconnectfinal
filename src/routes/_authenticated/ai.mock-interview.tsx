import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Mic, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  finishMockInterview,
  getInterviewSession,
  listInterviewSessions,
  startMockInterview,
  submitInterviewAnswer,
} from "@/lib/ai-interview.functions";
import { PageHeader } from "@/components/page-header";
import { ScoreDial } from "@/components/score-dial";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/ai/mock-interview")({
  head: () => ({
    meta: [
      { title: "AI Mock Interview — Career Connect" },
      {
        name: "description",
        content:
          "Practise role-specific interview questions and get scored, actionable feedback on every answer.",
      },
      { property: "og:title", content: "AI Mock Interview — Career Connect" },
      {
        property: "og:description",
        content: "Practise interviews with AI-generated questions and per-answer scoring.",
      },
    ],
  }),
  component: MockInterviewPage,
});

const DIFFICULTIES = ["gentle", "standard", "hard"] as const;

type Evaluation = {
  score: number;
  verdict: string;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
};

function MockInterviewPage() {
  const queryClient = useQueryClient();
  const start = useServerFn(startMockInterview);
  const load = useServerFn(getInterviewSession);
  const submit = useServerFn(submitInterviewAnswer);
  const finish = useServerFn(finishMockInterview);
  const loadSessions = useServerFn(listInterviewSessions);

  const [roleTitle, setRoleTitle] = useState("Frontend Engineer");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("standard");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({});
  const [summary, setSummary] = useState<{
    overallScore: number;
    summary: string;
    focusAreas: string[];
  } | null>(null);

  const { data: sessions = [] } = useQuery({
    queryKey: ["ai", "interview", "sessions"],
    queryFn: () => loadSessions({ data: undefined }),
  });

  const { data: current } = useQuery({
    queryKey: ["ai", "interview", sessionId],
    queryFn: () => load({ data: { sessionId: sessionId as string } }),
    enabled: Boolean(sessionId),
  });

  const begin = useMutation({
    mutationFn: () => start({ data: { roleTitle: roleTitle.trim(), difficulty } }),
    onSuccess: (result) => {
      setSessionId(result.sessionId);
      setAnswers({});
      setEvaluations({});
      setSummary(null);
      queryClient.invalidateQueries({ queryKey: ["ai", "interview", "sessions"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not start the interview."),
  });

  const answer = useMutation({
    mutationFn: ({ turnId, text }: { turnId: string; text: string }) =>
      submit({ data: { turnId, answer: text } }),
    onSuccess: (evaluation, variables) => {
      setEvaluations((prev) => ({ ...prev, [variables.turnId]: evaluation }));
      queryClient.invalidateQueries({ queryKey: ["ai", "interview", sessionId] });
    },
    onError: (error: Error) => toast.error(error.message || "That answer could not be scored."),
  });

  const complete = useMutation({
    mutationFn: () => finish({ data: { sessionId: sessionId as string } }),
    onSuccess: (result) => {
      setSummary(result);
      queryClient.invalidateQueries({ queryKey: ["ai", "interview", "sessions"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not close the interview."),
  });

  const turns = current?.turns ?? [];
  const answeredCount = turns.filter((t) => t.answer || evaluations[t.id]).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="AI intelligence"
        title="AI mock interview"
        description="Five tailored questions, scored answers and a model response for each one."
        actions={
          sessionId ? (
            <Button variant="outline" onClick={() => setSessionId(null)}>
              <RotateCcw className="size-4" />
              New interview
            </Button>
          ) : null
        }
      />

      {!sessionId ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4 rounded-xl border border-border bg-card p-6">
            <div className="space-y-2">
              <Label htmlFor="role">Role you are interviewing for</Label>
              <Input
                id="role"
                value={roleTitle}
                onChange={(event) => setRoleTitle(event.target.value)}
                placeholder="e.g. Data Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={difficulty === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDifficulty(level)}
                    className="capitalize"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={() => begin.mutate()} disabled={begin.isPending}>
              {begin.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mic className="size-4" />
              )}
              Start interview
            </Button>
          </div>

          <aside className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Past sessions
            </p>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No practice sessions yet.</p>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSessionId(s.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                >
                  <span className="line-clamp-1">{s.role_title}</span>
                  <Badge variant="secondary">{s.overall_score ?? "—"}</Badge>
                </button>
              ))
            )}
          </aside>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="secondary">{current?.session?.role_title ?? "Interview"}</Badge>
            <span className="capitalize">{current?.session?.difficulty ?? "standard"}</span>
            <span>
              {answeredCount} of {turns.length} answered
            </span>
          </div>

          {turns.map((turn) => {
            const evaluation = evaluations[turn.id] ?? (turn.feedback as Evaluation | null) ?? null;
            const scored = Boolean(evaluation && typeof evaluation.score === "number");
            return (
              <article
                key={turn.id}
                className="space-y-4 rounded-xl border border-border bg-card p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Question {turn.seq} · {String(turn.category).replace("_", " ")}
                    </p>
                    <h2 className="mt-1 font-display text-lg font-semibold">{turn.question}</h2>
                  </div>
                  {scored && evaluation ? <ScoreDial value={evaluation.score} size={64} /> : null}
                </div>

                <Textarea
                  rows={5}
                  placeholder="Type your answer…"
                  value={answers[turn.id] ?? turn.answer ?? ""}
                  onChange={(event) =>
                    setAnswers((prev) => ({ ...prev, [turn.id]: event.target.value }))
                  }
                />

                <Button
                  size="sm"
                  disabled={answer.isPending}
                  onClick={() =>
                    answer.mutate({
                      turnId: turn.id,
                      text: (answers[turn.id] ?? turn.answer ?? "").trim(),
                    })
                  }
                >
                  {answer.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  {scored ? "Re-score answer" : "Score my answer"}
                </Button>

                {scored && evaluation ? (
                  <div className="space-y-3 rounded-lg bg-muted p-4 text-sm">
                    <p className="font-medium">{evaluation.verdict}</p>
                    {evaluation.strengths?.length ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Strengths
                        </p>
                        <ul className="mt-1 list-inside list-disc">
                          {evaluation.strengths.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {evaluation.improvements?.length ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Improve
                        </p>
                        <ul className="mt-1 list-inside list-disc">
                          {evaluation.improvements.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {evaluation.modelAnswer ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Model answer
                        </p>
                        <p className="mt-1 leading-relaxed">{evaluation.modelAnswer}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}

          <Button onClick={() => complete.mutate()} disabled={complete.isPending}>
            {complete.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Finish and summarise
          </Button>

          {summary ? (
            <div className="flex flex-wrap items-start gap-6 rounded-xl border border-border bg-card p-6">
              <ScoreDial value={summary.overallScore} />
              <div className="flex-1 space-y-3">
                <p className="text-sm leading-relaxed">{summary.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {summary.focusAreas.map((f) => (
                    <Badge key={f} variant="secondary">
                      {f}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
