import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PlacementStudent = {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  branch: string | null;
  degree: string | null;
  college: string | null;
  batch: number | null;
  cgpa: number | null;
  openToWork: boolean;
  resumeScore: number | null;
  hasResume: boolean;
  eligible: boolean;
  placed: boolean;
  company: string | null;
  ctc: number | null;
  applications: number;
};

export type PlacementRecord = {
  id: string;
  studentId: string;
  studentName: string;
  branch: string | null;
  batch: number | null;
  company: string | null;
  roleTitle: string;
  ctc: number | null;
  placementDate: string;
  academicYear: string | null;
  verificationStatus: string;
};

const MIN_ELIGIBLE_CGPA = 6;

export function usePlacementData() {
  return useQuery({
    queryKey: ["placement-data"],
    queryFn: async () => {
      const [studentsRes, profilesRes, resumesRes, placementsRes, appsRes, companiesRes] =
        await Promise.all([
          supabase.from("students").select("*"),
          supabase.from("profiles").select("id, full_name, email"),
          supabase.from("resumes").select("student_id, ats_score, ai_score, is_primary"),
          supabase
            .from("placements")
            .select("*, companies(name, industry)")
            .order("placement_date", { ascending: false }),
          supabase
            .from("applications")
            .select("id, student_id, status, applied_at, jobs(title, company_id, companies(name))"),
          supabase.from("companies").select("*"),
        ]);

      const err =
        studentsRes.error ??
        profilesRes.error ??
        resumesRes.error ??
        placementsRes.error ??
        appsRes.error ??
        companiesRes.error;
      if (err) throw err;

      const profiles = new Map(
        (profilesRes.data ?? []).map((p) => [
          p.id,
          p as { full_name: string; email: string | null },
        ]),
      );
      const resumeByStudent = new Map<string, number | null>();
      for (const r of resumesRes.data ?? []) {
        const score = r.ats_score ?? r.ai_score ?? null;
        if (!resumeByStudent.has(r.student_id) || r.is_primary) {
          resumeByStudent.set(r.student_id, score);
        }
      }

      const placementRows = placementsRes.data ?? [];
      const placedByStudent = new Map(placementRows.map((p) => [p.student_id, p]));
      const appCount = new Map<string, number>();
      for (const a of appsRes.data ?? []) {
        appCount.set(a.student_id, (appCount.get(a.student_id) ?? 0) + 1);
      }

      const students: PlacementStudent[] = (studentsRes.data ?? []).map((s) => {
        const profile = profiles.get(s.user_id);
        const placement = placedByStudent.get(s.id);
        const hasResume = resumeByStudent.has(s.id);
        return {
          id: s.id,
          userId: s.user_id,
          name: profile?.full_name?.trim() || profile?.email || "Unnamed student",
          email: profile?.email ?? null,
          branch: s.branch,
          degree: s.degree,
          college: s.college,
          batch: s.graduation_year,
          cgpa: s.cgpa ? Number(s.cgpa) : null,
          openToWork: s.open_to_work,
          resumeScore: resumeByStudent.get(s.id) ?? null,
          hasResume,
          eligible: hasResume && (s.cgpa === null || Number(s.cgpa) >= MIN_ELIGIBLE_CGPA),
          placed: !!placement,
          company: placement?.companies?.name ?? null,
          ctc: placement?.ctc ?? null,
          applications: appCount.get(s.id) ?? 0,
        };
      });

      const studentMeta = new Map(students.map((s) => [s.id, s]));
      const records: PlacementRecord[] = placementRows.map((p) => {
        const s = studentMeta.get(p.student_id);
        return {
          id: p.id,
          studentId: p.student_id,
          studentName: s?.name ?? "Student",
          branch: s?.branch ?? null,
          batch: s?.batch ?? null,
          company: p.companies?.name ?? null,
          roleTitle: p.role_title,
          ctc: p.ctc,
          placementDate: p.placement_date,
          academicYear: p.academic_year,
          verificationStatus: p.verification_status,
        };
      });

      return {
        students,
        records,
        companies: companiesRes.data ?? [],
        applications: appsRes.data ?? [],
      };
    },
  });
}

export function formatLpa(ctc?: number | null) {
  if (!ctc) return "—";
  return `₹${(ctc / 100000).toFixed(1)} LPA`;
}

/* ------------------------------------------------------------------ */
/* Campus drives + company visits are not yet backed by the database.   */
/* Deterministic mock data keeps the portal demonstrable end to end.    */
/* ------------------------------------------------------------------ */

export type DriveStatus = "upcoming" | "ongoing" | "completed";

export type CampusDrive = {
  id: string;
  title: string;
  company: string;
  status: DriveStatus;
  date: string;
  venue: string;
  mode: "On campus" | "Virtual" | "Hybrid";
  seats: number;
  registered: number;
  eligibility: { branches: string[]; batch: number; minCgpa: number };
  roles: { title: string; packageLpa: number; location: string; type: string }[];
  skills: string[];
  hiringTeam: { name: string; title: string; email: string }[];
  offersMade?: number;
};

export const CAMPUS_DRIVES: CampusDrive[] = [
  {
    id: "drv-nimbus",
    title: "Nimbus Cloud Engineering Drive",
    company: "Nimbus Systems",
    status: "ongoing",
    date: "2026-08-07",
    venue: "Auditorium A",
    mode: "Hybrid",
    seats: 120,
    registered: 96,
    eligibility: { branches: ["CSE", "IT", "ECE"], batch: 2026, minCgpa: 7 },
    roles: [
      { title: "Cloud Engineer", packageLpa: 12, location: "Bengaluru", type: "Full time" },
      { title: "SRE Intern", packageLpa: 6, location: "Remote", type: "Internship" },
    ],
    skills: ["AWS", "Kubernetes", "Python", "Terraform"],
    hiringTeam: [
      { name: "Ritu Menon", title: "Campus Lead", email: "ritu@nimbus.example" },
      { name: "Arjun Rao", title: "Engineering Manager", email: "arjun@nimbus.example" },
    ],
  },
  {
    id: "drv-fintrail",
    title: "FinTrail Analyst Hiring Day",
    company: "FinTrail Capital",
    status: "upcoming",
    date: "2026-08-21",
    venue: "Seminar Hall 2",
    mode: "On campus",
    seats: 80,
    registered: 41,
    eligibility: { branches: ["CSE", "MBA", "Mathematics"], batch: 2026, minCgpa: 7.5 },
    roles: [
      { title: "Data Analyst", packageLpa: 10.5, location: "Mumbai", type: "Full time" },
      { title: "Risk Associate", packageLpa: 9, location: "Mumbai", type: "Full time" },
    ],
    skills: ["SQL", "Excel", "Python", "Statistics"],
    hiringTeam: [{ name: "Neha Bansal", title: "Talent Partner", email: "neha@fintrail.example" }],
  },
  {
    id: "drv-orbital",
    title: "Orbital Robotics Super Dream Drive",
    company: "Orbital Robotics",
    status: "upcoming",
    date: "2026-09-04",
    venue: "Innovation Centre",
    mode: "Virtual",
    seats: 60,
    registered: 18,
    eligibility: { branches: ["ECE", "EEE", "Mechanical"], batch: 2026, minCgpa: 8 },
    roles: [
      { title: "Embedded Engineer", packageLpa: 18, location: "Hyderabad", type: "Full time" },
    ],
    skills: ["C++", "RTOS", "Control Systems"],
    hiringTeam: [{ name: "Sam Iyer", title: "Head of Talent", email: "sam@orbital.example" }],
  },
  {
    id: "drv-brightlane",
    title: "Brightlane Product Drive",
    company: "Brightlane Labs",
    status: "completed",
    date: "2026-06-18",
    venue: "Auditorium A",
    mode: "On campus",
    seats: 100,
    registered: 100,
    offersMade: 23,
    eligibility: { branches: ["CSE", "IT"], batch: 2026, minCgpa: 6.5 },
    roles: [
      { title: "Product Engineer", packageLpa: 14, location: "Pune", type: "Full time" },
      { title: "QA Engineer", packageLpa: 8, location: "Pune", type: "Full time" },
    ],
    skills: ["React", "TypeScript", "Node.js"],
    hiringTeam: [
      { name: "Kavya Nair", title: "Recruiting Lead", email: "kavya@brightlane.example" },
    ],
  },
  {
    id: "drv-medisync",
    title: "MediSync Health Tech Drive",
    company: "MediSync Health",
    status: "completed",
    date: "2026-05-09",
    venue: "Seminar Hall 1",
    mode: "Hybrid",
    seats: 70,
    registered: 64,
    offersMade: 11,
    eligibility: { branches: ["CSE", "Biotech"], batch: 2026, minCgpa: 6 },
    roles: [{ title: "Software Engineer", packageLpa: 11, location: "Chennai", type: "Full time" }],
    skills: ["Java", "Spring", "SQL"],
    hiringTeam: [{ name: "Dev Sharma", title: "Campus Manager", email: "dev@medisync.example" }],
  },
];

export const DRIVE_STATUS_LABEL: Record<DriveStatus, string> = {
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  completed: "Completed",
};

export const PLACEMENT_TREND = [
  { year: "2021", placed: 182, offers: 210, avgLpa: 5.4 },
  { year: "2022", placed: 214, offers: 258, avgLpa: 6.1 },
  { year: "2023", placed: 246, offers: 301, avgLpa: 6.8 },
  { year: "2024", placed: 271, offers: 339, avgLpa: 7.6 },
  { year: "2025", placed: 298, offers: 366, avgLpa: 8.3 },
  { year: "2026", placed: 164, offers: 201, avgLpa: 9.1 },
];

export const SALARY_BANDS = [
  { band: "< 4 LPA", students: 28 },
  { band: "4–7 LPA", students: 96 },
  { band: "7–12 LPA", students: 74 },
  { band: "12–18 LPA", students: 31 },
  { band: "18+ LPA", students: 9 },
];

export const DEPARTMENT_STATS = [
  { department: "CSE", eligible: 180, placed: 162 },
  { department: "IT", eligible: 120, placed: 101 },
  { department: "ECE", eligible: 110, placed: 78 },
  { department: "EEE", eligible: 84, placed: 51 },
  { department: "Mechanical", eligible: 92, placed: 47 },
  { department: "Civil", eligible: 60, placed: 24 },
];

export const TOP_RECRUITERS = [
  { company: "Nimbus Systems", hires: 42, avgLpa: 11.8 },
  { company: "Brightlane Labs", hires: 31, avgLpa: 12.4 },
  { company: "FinTrail Capital", hires: 24, avgLpa: 10.2 },
  { company: "MediSync Health", hires: 19, avgLpa: 9.4 },
  { company: "Orbital Robotics", hires: 12, avgLpa: 16.1 },
];

export const OFFER_OUTCOMES = [
  { name: "Accepted", value: 168 },
  { name: "Pending", value: 27 },
  { name: "Declined", value: 21 },
];
