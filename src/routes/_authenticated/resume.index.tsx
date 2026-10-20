import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { analyzeResume } from "@/lib/ai.functions";
import { extractResumeText } from "@/lib/resume-text";
import { useCareers, useMyStudent, useMyStudentSkills, useMyResumes } from "@/lib/career";
import { useSession } from "@/lib/session";
import { buildStoragePath, validateUpload } from "@/security/files";
import { PageHeader } from "@/components/page-header";
import { ScoreDial } from "@/components/score-dial";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/resume/")({
  head: () => ({
    meta: [
      { title: "Resumes — Career Connect" },
      {
        name: "description",
        content: "Upload resumes, track versions and run the AI resume analyzer.",
      },
      { property: "og:title", content: "Resumes — Career Connect" },
      { property: "og:description", content: "Upload, version and analyze your resume with AI." },
    ],
  }),
  component: ResumeListPage,
});

function ResumeListPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: student } = useMyStudent();
  const { data: resumes = [] } = useMyResumes(student?.id);
  const { data: skills = [] } = useMyStudentSkills(student?.id);
  const { data: careers = [] } = useCareers();
  const runAnalysis = useServerFn(analyzeResume);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [stage, setStage] = useState<string | null>(null);

  const targetCareer = careers.find((c) => c.id === student?.target_career_id);

  const upload = useMutation({
    mutationFn: async () => {
      if (!student || !user) throw new Error("Profile not ready yet");
      let resumeText = text.trim();
      let filePath: string | null = null;

      if (file) {
        // Validated against the resume file policy (size, extension, MIME
        // agreement) before anything leaves the browser, then stored under a
        // path derived from the owner's id so traversal is impossible.
        const { safeName } = validateUpload("resume", {
          name: file.name,
          size: file.size,
          type: file.type,
        });
        setStage("Uploading file…");
        const path = buildStoragePath(user.id, safeName);
        const uploaded = await supabase.storage
          .from("resumes")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploaded.error) throw uploaded.error;
        filePath = path;

        if (!resumeText) {
          setStage("Extracting text…");
          resumeText = await extractResumeText(file);
        }
      }

      if (resumeText.length < 80) {
        throw new Error("We need at least a few lines of resume text to analyze.");
      }

      setStage("Analyzing with AI…");
      const analysis = await runAnalysis({
        data: {
          resumeText,
          targetCareer: targetCareer?.title,
          knownSkills: skills.map((s) => s.skills?.name ?? "").filter(Boolean),
          requiredSkills: (targetCareer?.career_skills ?? [])
            .map((cs) => cs.skills?.name ?? "")
            .filter(Boolean),
        },
      });

      setStage("Saving results…");
      const version = (resumes[0]?.version ?? 0) + 1;
      const { data, error } = await supabase
        .from("resumes")
        .insert({
          student_id: student.id,
          title: title.trim() || file?.name || `Resume v${version}`,
          version,
          parent_resume_id: resumes[0]?.id ?? null,
          file_path: filePath,
          raw_text: resumeText.slice(0, 40000),
          is_primary: resumes.length === 0,
          ai_score: analysis.score,
          ats_score: analysis.atsScore,
          ai_summary: analysis.summary,
          analyzed_at: new Date().toISOString(),
          extracted_skills: analysis.extractedSkills,
          missing_skills: analysis.missingSkills,
          improvements: analysis.improvements,
          strengths: analysis.strengths,
          experience: analysis.experience,
          education_items: analysis.education,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: async (id) => {
      await queryClient.invalidateQueries({ queryKey: ["resumes"] });
      setStage(null);
      setFile(null);
      setText("");
      setTitle("");
      toast.success("Resume analyzed");
      navigate({ to: "/resume/$resumeId", params: { resumeId: id } });
    },
    onError: (e: Error) => {
      setStage(null);
      toast.error(e.message);
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Resume AI"
        title="Resumes"
        description="Upload a resume, extract its content and get a scored, ATS-aware review."
      />

      <div className="surface-card space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Upload className="size-4 text-primary" />
          <p className="font-medium">Upload a new version</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="resume-title">Title</Label>
            <Input
              id="resume-title"
              value={title}
              placeholder="e.g. Backend intern resume"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resume-file">File (PDF or text)</Label>
            <Input
              id="resume-file"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="resume-text">Or paste the resume text</Label>
          <Textarea
            id="resume-text"
            rows={6}
            value={text}
            placeholder="Paste your resume content here if you don't have a PDF handy…"
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => upload.mutate()} disabled={upload.isPending}>
            {upload.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Analyze resume
          </Button>
          {stage ? <span className="text-sm text-muted-foreground">{stage}</span> : null}
          {targetCareer ? (
            <span className="text-sm text-muted-foreground">
              Benchmarked against <strong>{targetCareer.title}</strong>
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              Set a target career in your profile for sharper feedback.
            </span>
          )}
        </div>
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold">Version history</h2>
        <div className="mt-4 space-y-2">
          {resumes.map((r) => (
            <Link
              key={r.id}
              to="/resume/$resumeId"
              params={{ resumeId: r.id }}
              className="surface-card flex items-center justify-between gap-4 px-5 py-4 transition-shadow hover:shadow-[var(--shadow-lift)]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    v{r.version} · {new Date(r.created_at).toLocaleDateString()}
                    {r.is_primary ? " · primary" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {r.ats_score != null ? <Badge variant="outline">ATS {r.ats_score}</Badge> : null}
                <ScoreDial value={r.ai_score ?? 0} size={44} />
              </div>
            </Link>
          ))}
          {resumes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No resumes uploaded yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
