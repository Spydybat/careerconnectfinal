/**
 * Synthetic dataset generation.
 *
 * Deterministic: generateDatasets(config) with the same seed always returns
 * byte-identical output. No real personal data is used — names, emails and
 * companies are assembled from fictional token lists.
 */

import { CALENDAR_END, CALENDAR_START, type PlatformConfig } from "../config";
import { addDays, createRng, isoDate, isoTimestamp, slugify, type Rng } from "../random";
import {
  APPLICATION_STATUSES,
  BRANCHES,
  CERTIFICATION_BODIES,
  COLLEGE_PREFIX,
  COMPANY_PREFIX,
  COMPANY_SIZES,
  COMPANY_SUFFIX,
  COURSE_PROVIDERS,
  DEGREES,
  DOMAIN_SKILLS,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  FIRST_NAMES,
  INDUSTRIES,
  INTERVIEW_ROUNDS,
  JOB_CATEGORIES,
  LAST_NAMES,
  LOCATIONS,
  OFFER_STATUSES,
  ROLE_TITLES,
  SOFT_SKILLS,
  TECHNOLOGIES,
} from "../reference/taxonomy";
import type {
  ApplicationRecord,
  CertificationRecord,
  CollegeRecord,
  CompanyRecord,
  CourseRecord,
  EmploymentTypeRecord,
  ExperienceLevelRecord,
  HiringTrendRecord,
  InternshipRecord,
  InterviewRecord,
  JobCategoryRecord,
  JobRecord,
  LearningEnrollmentRecord,
  LocationRecord,
  PlacementRecord,
  RecruiterRecord,
  SalaryRecord,
  SkillRecord,
  StudentCertificationRecord,
  StudentRecord,
  SyntheticDatasets,
  TechnologyRecord,
} from "./types";

const pad = (n: number, width = 6) => String(n).padStart(width, "0");
const round = (n: number, digits = 2) => Number(n.toFixed(digits));

function monthsBetween(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  const start = new Date(startISO);
  const end = new Date(endISO);
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  while (cursor <= end) {
    out.push(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return out;
}

function fullName(rng: Rng): string {
  return `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
}

/** Synthetic mailbox on a reserved documentation domain (RFC 2606). */
function syntheticEmail(name: string, id: string, domain = "example.edu"): string {
  return `${slugify(name)}.${id.split("-").pop()}@${domain}`;
}

// ---------------------------------------------------------------- reference

function buildReference(): {
  job_categories: JobCategoryRecord[];
  locations: LocationRecord[];
  technologies: TechnologyRecord[];
  experience_levels: ExperienceLevelRecord[];
  employment_types: EmploymentTypeRecord[];
} {
  return {
    job_categories: JOB_CATEGORIES.map((c) => ({
      category_code: c.code,
      category_name: c.name,
      job_family: c.family,
    })),
    locations: LOCATIONS.map((l) => ({
      location_code: l.code,
      city: l.city,
      state: l.state,
      country: l.country,
      city_tier: l.tier,
      region: l.region,
    })),
    technologies: TECHNOLOGIES.map(([name, group]) => ({
      technology_code: slugify(name).toUpperCase(),
      technology_name: name,
      technology_group: group,
    })),
    experience_levels: EXPERIENCE_LEVELS.map((e) => ({
      experience_code: e.code,
      experience_name: e.name,
      min_years: e.minYears,
      max_years: e.maxYears,
      seniority_rank: e.rank,
    })),
    employment_types: EMPLOYMENT_TYPES.map((e) => ({
      employment_code: e.code,
      employment_name: e.name,
      is_internship: e.isInternship,
    })),
  };
}

// ------------------------------------------------------------------ skills

function buildSkills(rng: Rng, count: number): SkillRecord[] {
  const seeds: { name: string; category: SkillRecord["skill_category"]; group: string }[] = [
    ...TECHNOLOGIES.map(([name, group]) => ({
      name,
      category: "technical" as const,
      group,
    })),
    ...SOFT_SKILLS.map((name) => ({ name, category: "soft" as const, group: "Behavioural" })),
    ...DOMAIN_SKILLS.map((name) => ({ name, category: "domain" as const, group: "Functional" })),
  ];

  const out: SkillRecord[] = [];
  let i = 0;
  while (out.length < count) {
    const base = seeds[i % seeds.length]!;
    const generation = Math.floor(i / seeds.length);
    const name = generation === 0 ? base.name : `${base.name} (Advanced ${generation})`;
    out.push({
      skill_id: `SKL-${pad(i + 1, 5)}`,
      skill_name: name,
      skill_category: base.category,
      skill_group: base.group,
      demand_index: round(rng.skewed(10, 100, 1.4), 1),
      is_emerging: rng.bool(0.18),
    });
    i++;
  }
  return out;
}

function buildCertifications(
  rng: Rng,
  count: number,
  skills: SkillRecord[],
): CertificationRecord[] {
  const levels = ["foundation", "associate", "professional", "expert"] as const;
  return Array.from({ length: count }, (_, i) => {
    const skill = skills[i % skills.length]!;
    const level = rng.pick(levels);
    return {
      certification_id: `CRT-${pad(i + 1, 5)}`,
      certification_name: `${skill.skill_name} ${level.charAt(0).toUpperCase() + level.slice(1)} Certificate`,
      issuing_body: rng.pick(CERTIFICATION_BODIES),
      skill_id: skill.skill_id,
      level,
      validity_months: rng.pick([12, 24, 36, 60]),
    };
  });
}

// ---------------------------------------------------------------- colleges

function buildColleges(rng: Rng, count: number): CollegeRecord[] {
  const accreditations = ["A++", "A+", "A", "B++", "B"] as const;
  return Array.from({ length: count }, (_, i) => {
    const loc = rng.pick(LOCATIONS.filter((l) => l.code !== "REMOTE"));
    const name = `${rng.pick(COMPANY_PREFIX)} ${rng.pick(COLLEGE_PREFIX)}, ${loc.city}`;
    return {
      college_id: `COL-${pad(i + 1, 5)}`,
      college_name: name,
      college_code: `${loc.code}${pad(i + 1, 4)}`,
      location_code: loc.code,
      established_year: rng.int(1955, 2015),
      accreditation: rng.weighted([
        [accreditations[0], 8],
        [accreditations[1], 18],
        [accreditations[2], 34],
        [accreditations[3], 25],
        [accreditations[4], 15],
      ]),
      is_autonomous: rng.bool(0.45),
      student_strength: rng.int(600, 9000),
    };
  });
}

// ---------------------------------------------------------------- students

function buildStudents(
  rng: Rng,
  count: number,
  colleges: CollegeRecord[],
  skills: SkillRecord[],
  certifications: CertificationRecord[],
): StudentRecord[] {
  const technicalSkills = skills.filter((s) => s.skill_category === "technical");
  const otherSkills = skills.filter((s) => s.skill_category !== "technical");

  return Array.from({ length: count }, (_, i) => {
    const college = rng.pick(colleges);
    const degree = rng.weighted<(typeof DEGREES)[number]>([
      [DEGREES[0], 40],
      [DEGREES[1], 12],
      [DEGREES[2], 8],
      [DEGREES[3], 6],
      [DEGREES[4], 5],
      [DEGREES[5], 5],
      [DEGREES[6], 6],
      [DEGREES[7], 6],
      [DEGREES[8], 8],
      [DEGREES[9], 4],
    ]);
    const graduationYear = rng.int(2024, 2028);
    const enrollmentYear = graduationYear - degree.years;
    const name = fullName(rng);
    const cgpa = round(Math.min(10, Math.max(4.5, rng.normal(7.4, 0.95))), 2);
    const backlogs = rng.weighted([
      [0, 70],
      [1, 14],
      [2, 8],
      [3, 5],
      [5, 3],
    ]);
    const createdAt = rng.date(`${enrollmentYear}-06-01`, `${enrollmentYear + 1}-06-01`);
    const studentId = `STU-${pad(i + 1)}`;

    return {
      student_id: studentId,
      full_name: name,
      email: syntheticEmail(name, studentId),
      college_id: college.college_id,
      degree_code: degree.code,
      branch: rng.pick(BRANCHES),
      enrollment_year: enrollmentYear,
      graduation_year: graduationYear,
      cgpa,
      backlogs,
      location_code: rng.bool(0.75) ? college.location_code : rng.pick(LOCATIONS).code,
      gender: rng.weighted([
        ["female" as const, 44],
        ["male" as const, 52],
        ["other" as const, 2],
        ["undisclosed" as const, 2],
      ]),
      primary_skills: [
        ...rng.pickMany(technicalSkills, rng.int(3, 8)),
        ...rng.pickMany(otherSkills, rng.int(1, 3)),
      ].map((s) => s.skill_id),
      certifications: rng
        .pickMany(
          certifications,
          rng.weighted([
            [0, 45],
            [1, 25],
            [2, 18],
            [3, 8],
            [4, 4],
          ]),
        )
        .map((c) => c.certification_id),
      // Business rule (students.eligibility_requires_cgpa): a student is only
      // placement eligible with cgpa >= 6 AND zero active backlogs.
      is_placement_eligible: cgpa >= 6 && backlogs === 0,

      profile_completeness: rng.int(35, 100),
      created_at: isoTimestamp(createdAt),
      last_updated: isoTimestamp(addDays(createdAt, rng.int(1, 900))),
    };
  });
}

// --------------------------------------------------------------- companies

function buildCompanies(rng: Rng, count: number): CompanyRecord[] {
  const seen = new Set<string>();
  return Array.from({ length: count }, (_, i) => {
    let name = `${rng.pick(COMPANY_PREFIX)} ${rng.pick(COMPANY_SUFFIX)}`;
    while (seen.has(name)) name = `${rng.pick(COMPANY_PREFIX)} ${rng.pick(COMPANY_SUFFIX)} ${i}`;
    seen.add(name);
    const size = rng.weighted<(typeof COMPANY_SIZES)[number]>([
      [COMPANY_SIZES[0], 30],
      [COMPANY_SIZES[1], 28],
      [COMPANY_SIZES[2], 22],
      [COMPANY_SIZES[3], 12],
      [COMPANY_SIZES[4], 8],
    ]);
    const createdAt = rng.date("2019-01-01", "2025-06-01");
    return {
      company_id: `CMP-${pad(i + 1, 5)}`,
      company_name: name,
      industry: rng.pick(INDUSTRIES),
      size_code: size.code,
      headcount: rng.int(size.min, size.max),
      headquarters_location_code: rng.pick(LOCATIONS.filter((l) => l.code !== "REMOTE")).code,
      founded_year: rng.int(1985, 2023),
      is_hiring_partner: rng.bool(0.42),
      rating: round(Math.min(5, Math.max(2.1, rng.normal(3.9, 0.5))), 1),
      created_at: isoTimestamp(createdAt),
      last_updated: isoTimestamp(addDays(createdAt, rng.int(1, 600))),
    };
  });
}

function buildRecruiters(rng: Rng, count: number, companies: CompanyRecord[]): RecruiterRecord[] {
  const designations = [
    "Talent Acquisition Specialist",
    "Campus Recruiter",
    "HR Manager",
    "Technical Recruiter",
    "Head of Talent",
    "Recruitment Coordinator",
  ];
  return Array.from({ length: count }, (_, i) => {
    const company = companies[i % companies.length]!;
    const name = fullName(rng);
    const recruiterId = `REC-${pad(i + 1, 5)}`;
    const joinedAt = rng.date("2021-01-01", "2026-01-01");
    return {
      recruiter_id: recruiterId,
      full_name: name,
      email: syntheticEmail(name, recruiterId, "example.com"),
      company_id: company.company_id,
      designation: rng.pick(designations),
      hires_made: rng.int(0, 180),
      joined_at: isoTimestamp(joinedAt),
      is_active: rng.bool(0.86),
      last_updated: isoTimestamp(addDays(joinedAt, rng.int(1, 500))),
    };
  });
}

// -------------------------------------------------------------------- jobs

function salaryBand(rng: Rng, experienceRank: number, tier: number): [number, number] {
  const base = 350_000 + experienceRank * 620_000;
  const tierFactor = tier === 1 ? 1.18 : tier === 2 ? 1.0 : tier === 0 ? 1.08 : 0.86;
  const min = Math.round((base * tierFactor * (0.85 + rng.next() * 0.2)) / 1000) * 1000;
  const max = Math.round((min * (1.25 + rng.next() * 0.65)) / 1000) * 1000;
  return [min, max];
}

function buildJobs(
  rng: Rng,
  count: number,
  companies: CompanyRecord[],
  recruiters: RecruiterRecord[],
  skills: SkillRecord[],
  technologies: TechnologyRecord[],
): JobRecord[] {
  const byCompany = new Map<string, RecruiterRecord[]>();
  for (const r of recruiters) {
    const list = byCompany.get(r.company_id) ?? [];
    list.push(r);
    byCompany.set(r.company_id, list);
  }

  return Array.from({ length: count }, (_, i) => {
    const company = rng.pick(companies);
    const recruiterPool = byCompany.get(company.company_id);
    const recruiter =
      recruiterPool && recruiterPool.length > 0 ? rng.pick(recruiterPool) : rng.pick(recruiters);
    const category = rng.weighted(
      JOB_CATEGORIES.map(
        (c) => [c, c.family === "Technology" ? 6 : c.family === "Business" ? 3 : 2] as const,
      ),
    );
    const employment = rng.weighted<(typeof EMPLOYMENT_TYPES)[number]>([
      [EMPLOYMENT_TYPES[0], 62],
      [EMPLOYMENT_TYPES[1], 5],
      [EMPLOYMENT_TYPES[2], 9],
      [EMPLOYMENT_TYPES[3], 18],
      [EMPLOYMENT_TYPES[4], 3],
      [EMPLOYMENT_TYPES[5], 3],
    ]);
    const experience = employment.isInternship
      ? EXPERIENCE_LEVELS[0]
      : rng.weighted<(typeof EXPERIENCE_LEVELS)[number]>([
          [EXPERIENCE_LEVELS[1], 34],
          [EXPERIENCE_LEVELS[2], 32],
          [EXPERIENCE_LEVELS[3], 20],
          [EXPERIENCE_LEVELS[4], 10],
          [EXPERIENCE_LEVELS[5], 4],
        ]);
    const location = rng.weighted(
      LOCATIONS.map(
        (l) => [l, l.tier === 1 ? 8 : l.tier === 0 ? 6 : l.tier === 2 ? 3 : 1] as const,
      ),
    );
    const postedAt = rng.date(CALENDAR_START, "2026-08-01");
    const [minSalary, maxSalary] = salaryBand(rng, experience.rank, location.tier);
    const titles = ROLE_TITLES[category.code] ?? ["Associate"];

    return {
      job_id: `JOB-${pad(i + 1)}`,
      company_id: company.company_id,
      recruiter_id: recruiter.recruiter_id,
      title: `${employment.isInternship ? "Intern - " : ""}${rng.pick(titles)}`,
      category_code: category.code,
      employment_code: employment.code,
      experience_code: experience.code,
      location_code: location.code,
      is_remote: location.code === "REMOTE" || rng.bool(0.14),
      min_salary: employment.isInternship ? Math.round(minSalary * 0.12) : minSalary,
      max_salary: employment.isInternship ? Math.round(maxSalary * 0.12) : maxSalary,
      currency: "INR",
      openings: rng.weighted([
        [1, 45],
        [2, 25],
        [3, 14],
        [5, 9],
        [10, 5],
        [25, 2],
      ]),
      required_skills: rng.pickMany(skills, rng.int(3, 7)).map((s) => s.skill_id),
      required_technologies: rng
        .pickMany(technologies, rng.int(2, 6))
        .map((t) => t.technology_code),
      posted_at: isoTimestamp(postedAt),
      closes_at: isoTimestamp(addDays(postedAt, rng.int(21, 120))),
      status: rng.weighted([
        ["open" as const, 40],
        ["closed" as const, 32],
        ["filled" as const, 22],
        ["draft" as const, 6],
      ]),
      last_updated: isoTimestamp(addDays(postedAt, rng.int(0, 60))),
    };
  });
}

function buildInternships(rng: Rng, jobs: JobRecord[], limit: number): InternshipRecord[] {
  const internshipJobs = jobs.filter(
    (j) => j.employment_code === "INTERNSHIP" || j.employment_code === "APPRENTICE",
  );
  return internshipJobs.slice(0, limit).map((job, i) => ({
    internship_id: `INT-${pad(i + 1, 5)}`,
    job_id: job.job_id,
    company_id: job.company_id,
    duration_weeks: rng.pick([8, 12, 16, 24, 26, 52]),
    stipend_monthly: rng.int(5_000, 80_000),
    is_ppo_offered: rng.bool(0.55),
    start_month: job.posted_at.slice(0, 7),
    last_updated: job.last_updated,
  }));
}

// ------------------------------------------------------- applications flow

function statusForFunnel(rng: Rng): string {
  return rng.weighted([
    [APPLICATION_STATUSES[0], 30],
    [APPLICATION_STATUSES[1], 20],
    [APPLICATION_STATUSES[2], 14],
    [APPLICATION_STATUSES[3], 10],
    [APPLICATION_STATUSES[4], 6],
    [APPLICATION_STATUSES[5], 5],
    [APPLICATION_STATUSES[6], 12],
    [APPLICATION_STATUSES[7], 3],
  ]);
}

function buildApplications(
  rng: Rng,
  count: number,
  students: StudentRecord[],
  jobs: JobRecord[],
): ApplicationRecord[] {
  const activeJobs = jobs.filter((j) => j.status !== "draft");
  const pool = activeJobs.length > 0 ? activeJobs : jobs;
  const seen = new Set<string>();
  const out: ApplicationRecord[] = [];
  let attempts = 0;

  while (out.length < count && attempts < count * 4) {
    attempts++;
    const student = rng.pick(students);
    const job = rng.pick(pool);
    const key = `${student.student_id}|${job.job_id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const posted = new Date(job.posted_at);
    const appliedAt = addDays(posted, rng.int(0, 45));
    const overlap = student.primary_skills.filter((s) => job.required_skills.includes(s)).length;
    const matchScore = Math.min(
      99,
      Math.max(12, Math.round(30 + overlap * 9 + (student.cgpa - 6) * 6 + rng.normal(0, 8))),
    );

    out.push({
      application_id: `APP-${pad(out.length + 1, 7)}`,
      student_id: student.student_id,
      job_id: job.job_id,
      company_id: job.company_id,
      applied_at: isoTimestamp(appliedAt),
      status: statusForFunnel(rng),
      source: rng.weighted([
        ["portal" as const, 58],
        ["campus_drive" as const, 24],
        ["referral" as const, 12],
        ["recruiter_outreach" as const, 6],
      ]),
      match_score: matchScore,
      resume_version: rng.int(1, 5),
      last_updated: isoTimestamp(addDays(appliedAt, rng.int(0, 60))),
    });
  }
  return out;
}

function buildInterviews(
  rng: Rng,
  count: number,
  applications: ApplicationRecord[],
): InterviewRecord[] {
  const eligible = applications.filter((a) =>
    ["shortlisted", "interviewing", "offered", "hired", "rejected"].includes(a.status),
  );
  const source = eligible.length > 0 ? eligible : applications;
  const out: InterviewRecord[] = [];

  let i = 0;
  while (out.length < count && source.length > 0) {
    const app = source[i % source.length]!;
    const rounds = rng.int(1, 4);
    const applied = new Date(app.applied_at);
    for (let r = 0; r < rounds && out.length < count; r++) {
      const scheduled = addDays(applied, 5 + r * rng.int(3, 10));
      const isFinalKnown = app.status === "hired" || app.status === "offered";
      out.push({
        interview_id: `IVW-${pad(out.length + 1, 7)}`,
        application_id: app.application_id,
        student_id: app.student_id,
        job_id: app.job_id,
        company_id: app.company_id,
        round_name: INTERVIEW_ROUNDS[Math.min(r, INTERVIEW_ROUNDS.length - 1)]!,
        round_number: r + 1,
        scheduled_at: isoTimestamp(scheduled),
        duration_minutes: rng.pick([30, 45, 60, 90]),
        mode: rng.weighted([
          ["virtual" as const, 66],
          ["onsite" as const, 24],
          ["telephonic" as const, 10],
        ]),
        outcome: isFinalKnown
          ? rng.weighted([
              ["passed", 78],
              ["on_hold", 12],
              ["scheduled", 10],
            ])
          : rng.weighted([
              ["passed", 38],
              ["failed", 34],
              ["on_hold", 12],
              ["no_show", 6],
              ["scheduled", 10],
            ]),
        score: rng.bool(0.82) ? rng.int(35, 98) : null,
        feedback_provided: rng.bool(0.7),
        last_updated: isoTimestamp(addDays(scheduled, rng.int(0, 14))),
      });
    }
    i++;
  }
  return out;
}

function buildPlacements(
  rng: Rng,
  count: number,
  applications: ApplicationRecord[],
  jobs: JobRecord[],
  students: StudentRecord[],
): PlacementRecord[] {
  const jobById = new Map(jobs.map((j) => [j.job_id, j]));
  const studentById = new Map(students.map((s) => [s.student_id, s]));
  const hired = applications.filter((a) => a.status === "hired" || a.status === "offered");
  const source =
    hired.length >= count ? hired : [...hired, ...applications.filter((a) => !hired.includes(a))];

  return source.slice(0, count).map((app, i) => {
    const job = jobById.get(app.job_id)!;
    const student = studentById.get(app.student_id)!;
    const offerDate = addDays(new Date(app.applied_at), rng.int(14, 90));
    const ctc =
      Math.round(
        (job.min_salary + rng.next() * Math.max(1, job.max_salary - job.min_salary)) / 1000,
      ) * 1000;
    const bonus = Math.round(ctc * rng.skewed(0, 0.18, 1.6));
    return {
      placement_id: `PLC-${pad(i + 1, 6)}`,
      student_id: app.student_id,
      application_id: app.application_id,
      job_id: app.job_id,
      company_id: app.company_id,
      college_id: student.college_id,
      offer_date: isoDate(offerDate),
      joining_date: isoDate(addDays(offerDate, rng.int(30, 210))),
      offer_status: rng.weighted([
        [OFFER_STATUSES[0], 18],
        [OFFER_STATUSES[1], 34],
        [OFFER_STATUSES[2], 12],
        [OFFER_STATUSES[3], 33],
        [OFFER_STATUSES[4], 3],
      ]),
      ctc_annual: ctc,
      base_salary: Math.round((ctc - bonus) / 1000) * 1000,
      bonus,
      location_code: job.location_code,
      placement_season: `${offerDate.getUTCFullYear()}-${offerDate.getUTCMonth() >= 6 ? "H2" : "H1"}`,
      last_updated: isoTimestamp(addDays(offerDate, rng.int(0, 45))),
    };
  });
}

function buildSalaries(rng: Rng, count: number, jobs: JobRecord[]): SalaryRecord[] {
  return Array.from({ length: count }, (_, i) => {
    const job = jobs[i % jobs.length]!;
    const median = Math.round((job.min_salary + job.max_salary) / 2 / 1000) * 1000;
    return {
      salary_id: `SAL-${pad(i + 1, 6)}`,
      job_id: job.job_id,
      company_id: job.company_id,
      category_code: job.category_code,
      experience_code: job.experience_code,
      location_code: job.location_code,
      currency: "INR",
      base_min: job.min_salary,
      base_max: job.max_salary,
      base_median: median,
      bonus_pct: round(rng.skewed(0, 22, 1.5), 1),
      equity_pct: round(rng.skewed(0, 12, 2.2), 2),
      observed_month: job.posted_at.slice(0, 7),
      sample_size: rng.int(3, 240),
      last_updated: job.last_updated,
    };
  });
}

function buildCourses(rng: Rng, count: number, skills: SkillRecord[]): CourseRecord[] {
  const levels = ["beginner", "intermediate", "advanced"] as const;
  return Array.from({ length: count }, (_, i) => {
    const skill = skills[i % skills.length]!;
    const level = rng.pick(levels);
    return {
      course_id: `CRS-${pad(i + 1, 5)}`,
      course_name: `${skill.skill_name} — ${level.charAt(0).toUpperCase() + level.slice(1)} Track`,
      provider: rng.pick(COURSE_PROVIDERS),
      skill_id: skill.skill_id,
      level,
      duration_hours: rng.pick([6, 10, 15, 20, 30, 45, 60]),
      rating: round(Math.min(5, Math.max(2.5, rng.normal(4.2, 0.4))), 1),
      enrolled_count: Math.round(rng.skewed(50, 42_000, 2.1)),
      completion_rate: round(Math.min(0.98, Math.max(0.08, rng.normal(0.46, 0.18))), 3),
      is_certified: rng.bool(0.6),
      last_updated: isoTimestamp(rng.date("2024-01-01", "2026-08-01")),
    };
  });
}

function buildLearningEnrollments(
  rng: Rng,
  students: StudentRecord[],
  courses: CourseRecord[],
  perStudentMax: number,
): LearningEnrollmentRecord[] {
  const out: LearningEnrollmentRecord[] = [];
  for (const student of students) {
    const n = rng.weighted([
      [0, 30],
      [1, 28],
      [2, 20],
      [3, 12],
      [4, 7],
      [perStudentMax, 3],
    ]);
    for (const course of rng.pickMany(courses, n)) {
      const enrolledAt = rng.date("2024-01-01", "2026-07-01");
      const progress = rng.int(0, 100);
      const completed = progress === 100;
      out.push({
        enrollment_id: `ENR-${pad(out.length + 1, 7)}`,
        student_id: student.student_id,
        course_id: course.course_id,
        skill_id: course.skill_id,
        enrolled_at: isoTimestamp(enrolledAt),
        completed_at: completed ? isoTimestamp(addDays(enrolledAt, rng.int(7, 180))) : null,
        progress_pct: progress,
        hours_spent: round((course.duration_hours * progress) / 100, 1),
        score: completed ? rng.int(40, 100) : null,
        last_updated: isoTimestamp(addDays(enrolledAt, rng.int(1, 200))),
      });
    }
  }
  return out;
}

function buildStudentCertifications(
  rng: Rng,
  students: StudentRecord[],
  certifications: CertificationRecord[],
): StudentCertificationRecord[] {
  const byId = new Map(certifications.map((c) => [c.certification_id, c]));
  const out: StudentCertificationRecord[] = [];
  for (const student of students) {
    for (const certId of student.certifications) {
      const cert = byId.get(certId);
      if (!cert) continue;
      const issuedAt = rng.date("2023-06-01", "2026-06-01");
      out.push({
        student_certification_id: `SCR-${pad(out.length + 1, 7)}`,
        student_id: student.student_id,
        certification_id: certId,
        issued_at: isoDate(issuedAt),
        expires_at: isoDate(addDays(issuedAt, cert.validity_months * 30)),
        verified: rng.bool(0.72),
        last_updated: isoTimestamp(addDays(issuedAt, rng.int(0, 120))),
      });
    }
  }
  return out;
}

function buildHiringTrends(
  rng: Rng,
  jobs: JobRecord[],
  applications: ApplicationRecord[],
  placements: PlacementRecord[],
): HiringTrendRecord[] {
  const months = monthsBetween(CALENDAR_START, CALENDAR_END);
  const jobById = new Map(jobs.map((j) => [j.job_id, j]));
  const applicationById = new Map(applications.map((a) => [a.application_id, a]));
  const agg = new Map<string, { jobs: number; apps: number; offers: number }>();

  const key = (month: string, category: string, location: string) =>
    `${month}|${category}|${location}`;
  const bump = (k: string, field: "jobs" | "apps" | "offers") => {
    const row = agg.get(k) ?? { jobs: 0, apps: 0, offers: 0 };
    row[field] += 1;
    agg.set(k, row);
  };

  for (const job of jobs)
    bump(key(job.posted_at.slice(0, 7), job.category_code, job.location_code), "jobs");
  for (const app of applications) {
    const job = jobById.get(app.job_id);
    if (job) bump(key(app.applied_at.slice(0, 7), job.category_code, job.location_code), "apps");
  }
  // Offers are attributed to the APPLICATION COHORT bucket (the month the
  // originating application was received, with the job's category/location),
  // not to the offer month. This keeps the business rule
  // `offers_made <= applications_received` structurally true for every bucket:
  // each counted offer is derived from an application counted in the same key.
  for (const plc of placements) {
    const app = applicationById.get(plc.application_id);
    const job = jobById.get(plc.job_id);
    if (!app || !job) continue;
    bump(key(app.applied_at.slice(0, 7), job.category_code, job.location_code), "offers");
  }

  const out: HiringTrendRecord[] = [];
  for (const k of [...agg.keys()].sort()) {
    const [month, category, location] = k.split("|") as [string, string, string];
    if (!months.includes(month)) continue;
    const row = agg.get(k)!;
    out.push({
      trend_id: `TRD-${pad(out.length + 1, 6)}`,
      month,
      category_code: category,
      location_code: location,
      jobs_posted: row.jobs,
      applications_received: row.apps,
      offers_made: row.offers,
      avg_time_to_hire_days: rng.int(12, 75),
      demand_index: round(Math.min(100, (row.jobs * 4 + row.apps * 0.4) / 2), 1),
      last_updated: `${month}-28T00:00:00.000Z`,
    });
  }
  return out;
}

// ------------------------------------------------------------------- entry

export function generateDatasets(config: PlatformConfig): SyntheticDatasets {
  const v = config.volumes;
  const seedFor = (name: string) => createRng(`${config.seed}:${name}`);

  const reference = buildReference();
  const skills = buildSkills(seedFor("skills"), v.skills);
  const certifications = buildCertifications(seedFor("certifications"), v.certifications, skills);
  const colleges = buildColleges(seedFor("colleges"), v.colleges);
  const students = buildStudents(seedFor("students"), v.students, colleges, skills, certifications);
  const companies = buildCompanies(seedFor("companies"), v.companies);
  const recruiters = buildRecruiters(seedFor("recruiters"), v.recruiters, companies);
  const jobs = buildJobs(
    seedFor("jobs"),
    v.jobs,
    companies,
    recruiters,
    skills,
    reference.technologies,
  );
  const internships = buildInternships(seedFor("internships"), jobs, v.internships);
  const applications = buildApplications(seedFor("applications"), v.applications, students, jobs);
  const interviews = buildInterviews(seedFor("interviews"), v.interviews, applications);
  const placements = buildPlacements(
    seedFor("placements"),
    v.placements,
    applications,
    jobs,
    students,
  );
  const salaries = buildSalaries(seedFor("salaries"), v.salaries, jobs);
  const courses = buildCourses(seedFor("courses"), v.courses, skills);
  const learning_enrollments = buildLearningEnrollments(seedFor("learning"), students, courses, 6);
  const student_certifications = buildStudentCertifications(
    seedFor("student_certs"),
    students,
    certifications,
  );
  const hiring_trends = buildHiringTrends(seedFor("trends"), jobs, applications, placements);

  return {
    ...reference,
    skills,
    certifications,
    colleges,
    students,
    companies,
    recruiters,
    jobs,
    internships,
    applications,
    interviews,
    placements,
    salaries,
    courses,
    hiring_trends,
    learning_enrollments,
    student_certifications,
  };
}
