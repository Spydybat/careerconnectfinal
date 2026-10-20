import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Download, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ownsStoragePath } from "@/security/files";
import { useMyResumes, useMyStudent, useMyStudentSkills, useResume, useSkills } from "@/lib/career";
import { useSession } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { ScoreDial } from "@/components/score-dial";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/resume/$resumeId")({
  head: () => ({
    meta: [
      { title: "Resume analysis — Career Connect" },
      {
        name: "description",
        content: "Resume score, ATS score, extracted skills and improvement suggestions.",
      },
      { property: "og:title", content: "Resume analysis — Career Connect" },
      { property: "og:description", content: "AI resume score card and improvement plan." },
    ],
  }),
  component: ResumeDetailPage,
});

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function rows<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function ResumeDetailPage() {
  const { resumeId } = Route.useParams();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { data: resume, isLoading } = useResume(resumeId);
  const { data: student } = useMyStudent();
  const { data: versions = [] } = useMyResumes(student?.id);
  const { data: allSkills = [] } = useSkills();
  const { data: mySkills = [] } = useMyStudentSkills(student?.id);

  const held = new Set(mySkills.map((s) => s.skill_id));

  const setPrimary = useMutation({
    mutationFn: async () => {
      if (!student) return;
      await supabase.from("resumes").update({ is_primary: false }).eq("student_id", student.id);
      const { error } = await supabase
        .from("resumes")
        .update({ is_primary: true })
        .eq("id", resumeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      queryClient.invalidateQueries({ queryKey: ["resume", resumeId] });
      toast.success("Set as primary resume");
    },
  });

  const addSkill = useMutation({
    mutationFn: async (name: string) => {
      const match = allSkills.find((s) => s.name.toLowerCase() === name.toLowerCase());
      if (!match) throw new Error(`${name} isn't in the skill library yet`);
      if (!student) throw new Error("Profile not ready");
      const { error } = await supabase
        .from("student_skills")
        .insert({ student_id: student.id, skill_id: match.id, proficiency: 3, source: "resume" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-skills"] });
      toast.success("Added to your profile");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function download() {
    if (!resume?.file_path) return;
    // First-layer ownership check; storage RLS is the second layer.
    if (!user || !ownsStoragePath(user.id, resume.file_path)) {
      toast.error("You don't have access to that file");
      return;
    }
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(resume.file_path, 60);
    if (error || !data) {
      toast.error("Could not open the file");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading analysis…</p>;
  if (!resume) return <p className="text-sm text-muted-foreground">Resume not found.</p>;

  const extracted = list(resume.extracted_skills);
  const missing = list(resume.missing_skills);
  const improvements = list(resume.improvements);
  const strengths = list(resume.strengths);
  const experience = rows<{
    role: string;
    organisation: string;
    duration: string;
    highlight: string;
  }>(resume.experience);
  const education = rows<{ qualification: string; institution: string; year: string }>(
    resume.education_items,
  );

  return (
    <div className="space-y-8">
      <Link
        to="/resume"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All resumes
      </Link>

      <PageHeader
        eyebrow={`Version ${resume.version}`}
        title={resume.title}
        description={resume.ai_summary ?? "Analysis summary unavailable."}
        actions={
          <div className="flex gap-2">
            {resume.file_path ? (
              <Button variant="outline" onClick={download}>
                <Download className="size-4" /> Original file
              </Button>
            ) : null}
            {!resume.is_primary ? (
              <Button onClick={() => setPrimary.mutate()} disabled={setPrimary.isPending}>
                <Star className="size-4" /> Set as primary
              </Button>
            ) : (
              <Badge>Primary resume</Badge>
            )}
          </div>
        }
      />

      <div className="surface-card grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreDial value={resume.ai_score ?? 0} label="Resume score" />
        <ScoreDial value={resume.ats_score ?? 0} label="ATS score" />
        <div>
          <p className="text-sm text-muted-foreground">Skills detected</p>
          <p className="font-display text-3xl font-semibold">{extracted.length}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Gaps to close</p>
          <p className="font-display text-3xl font-semibold">{missing.length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h2 className="font-display text-base font-semibold">Extracted skills</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {extracted.map((s) => {
              const match = allSkills.find((k) => k.name.toLowerCase() === s.toLowerCase());
              const onProfile = match ? held.has(match.id) : false;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={onProfile || !match}
                  onClick={() => addSkill.mutate(s)}
                  className="rounded-full border border-border px-3 py-1 text-xs disabled:opacity-60"
                >
                  {s} {onProfile ? <Check className="ml-1 inline size-3" /> : match ? "+" : ""}
                </button>
              );
            })}
            {extracted.length === 0 ? (
              <p className="text-sm text-muted-foreground">No skills detected.</p>
            ) : null}
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-display text-base font-semibold">Missing skills</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {missing.map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
            {missing.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing critical missing.</p>
            ) : null}
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-display text-base font-semibold">Improvement suggestions</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {improvements.map((i) => (
              <li key={i}>• {i}</li>
            ))}
          </ul>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-display text-base font-semibold">Strengths</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {strengths.map((i) => (
              <li key={i}>• {i}</li>
            ))}
          </ul>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-display text-base font-semibold">Experience detected</h2>
          <div className="mt-3 space-y-3">
            {experience.map((e, i) => (
              <div key={i}>
                <p className="text-sm font-medium">
                  {e.role} · {e.organisation}
                </p>
                <p className="text-xs text-muted-foreground">{e.duration}</p>
                <p className="text-sm text-muted-foreground">{e.highlight}</p>
              </div>
            ))}
            {experience.length === 0 ? (
              <p className="text-sm text-muted-foreground">No experience entries found.</p>
            ) : null}
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-display text-base font-semibold">Education detected</h2>
          <div className="mt-3 space-y-3">
            {education.map((e, i) => (
              <div key={i}>
                <p className="text-sm font-medium">{e.qualification}</p>
                <p className="text-xs text-muted-foreground">
                  {e.institution} · {e.year}
                </p>
              </div>
            ))}
            {education.length === 0 ? (
              <p className="text-sm text-muted-foreground">No education entries found.</p>
            ) : null}
          </div>
        </section>
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold">Version history</h2>
        <div className="mt-3 space-y-2">
          {versions.map((v) => (
            <Link
              key={v.id}
              to="/resume/$resumeId"
              params={{ resumeId: v.id }}
              className="surface-card flex items-center justify-between px-5 py-3 text-sm"
            >
              <span className={v.id === resume.id ? "font-semibold" : ""}>
                v{v.version} · {v.title}
              </span>
              <span className="text-muted-foreground">
                {v.ai_score ?? "—"} / ATS {v.ats_score ?? "—"}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
