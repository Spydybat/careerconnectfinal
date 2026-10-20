/** Source-layer (raw) record shapes for every synthetic dataset. */

export interface JobCategoryRecord {
  category_code: string;
  category_name: string;
  job_family: string;
}

export interface LocationRecord {
  location_code: string;
  city: string;
  state: string;
  country: string;
  city_tier: number;
  region: string;
}

export interface TechnologyRecord {
  technology_code: string;
  technology_name: string;
  technology_group: string;
}

export interface ExperienceLevelRecord {
  experience_code: string;
  experience_name: string;
  min_years: number;
  max_years: number;
  seniority_rank: number;
}

export interface EmploymentTypeRecord {
  employment_code: string;
  employment_name: string;
  is_internship: boolean;
}

export interface SkillRecord {
  skill_id: string;
  skill_name: string;
  skill_category: "technical" | "soft" | "domain";
  skill_group: string;
  demand_index: number;
  is_emerging: boolean;
}

export interface CertificationRecord {
  certification_id: string;
  certification_name: string;
  issuing_body: string;
  skill_id: string;
  level: "foundation" | "associate" | "professional" | "expert";
  validity_months: number;
}

export interface CollegeRecord {
  college_id: string;
  college_name: string;
  college_code: string;
  location_code: string;
  established_year: number;
  accreditation: "A++" | "A+" | "A" | "B++" | "B";
  is_autonomous: boolean;
  student_strength: number;
}

export interface StudentRecord {
  student_id: string;
  full_name: string;
  email: string;
  college_id: string;
  degree_code: string;
  branch: string;
  enrollment_year: number;
  graduation_year: number;
  cgpa: number;
  backlogs: number;
  location_code: string;
  gender: "female" | "male" | "other" | "undisclosed";
  primary_skills: string[];
  certifications: string[];
  is_placement_eligible: boolean;
  profile_completeness: number;
  created_at: string;
  last_updated: string;
}

export interface CompanyRecord {
  company_id: string;
  company_name: string;
  industry: string;
  size_code: string;
  headcount: number;
  headquarters_location_code: string;
  founded_year: number;
  is_hiring_partner: boolean;
  rating: number;
  created_at: string;
  last_updated: string;
}

export interface RecruiterRecord {
  recruiter_id: string;
  full_name: string;
  email: string;
  company_id: string;
  designation: string;
  hires_made: number;
  joined_at: string;
  is_active: boolean;
  last_updated: string;
}

export interface JobRecord {
  job_id: string;
  company_id: string;
  recruiter_id: string;
  title: string;
  category_code: string;
  employment_code: string;
  experience_code: string;
  location_code: string;
  is_remote: boolean;
  min_salary: number;
  max_salary: number;
  currency: string;
  openings: number;
  required_skills: string[];
  required_technologies: string[];
  posted_at: string;
  closes_at: string;
  status: "open" | "closed" | "filled" | "draft";
  last_updated: string;
}

export interface InternshipRecord {
  internship_id: string;
  job_id: string;
  company_id: string;
  duration_weeks: number;
  stipend_monthly: number;
  is_ppo_offered: boolean;
  start_month: string;
  last_updated: string;
}

export interface ApplicationRecord {
  application_id: string;
  student_id: string;
  job_id: string;
  company_id: string;
  applied_at: string;
  status: string;
  source: "portal" | "campus_drive" | "referral" | "recruiter_outreach";
  match_score: number;
  resume_version: number;
  last_updated: string;
}

export interface InterviewRecord {
  interview_id: string;
  application_id: string;
  student_id: string;
  job_id: string;
  company_id: string;
  round_name: string;
  round_number: number;
  scheduled_at: string;
  duration_minutes: number;
  mode: "onsite" | "virtual" | "telephonic";
  outcome: string;
  score: number | null;
  feedback_provided: boolean;
  last_updated: string;
}

export interface PlacementRecord {
  placement_id: string;
  student_id: string;
  application_id: string;
  job_id: string;
  company_id: string;
  college_id: string;
  offer_date: string;
  joining_date: string;
  offer_status: string;
  ctc_annual: number;
  base_salary: number;
  bonus: number;
  location_code: string;
  placement_season: string;
  last_updated: string;
}

export interface SalaryRecord {
  salary_id: string;
  job_id: string;
  company_id: string;
  category_code: string;
  experience_code: string;
  location_code: string;
  currency: string;
  base_min: number;
  base_max: number;
  base_median: number;
  bonus_pct: number;
  equity_pct: number;
  observed_month: string;
  sample_size: number;
  last_updated: string;
}

export interface CourseRecord {
  course_id: string;
  course_name: string;
  provider: string;
  skill_id: string;
  level: "beginner" | "intermediate" | "advanced";
  duration_hours: number;
  rating: number;
  enrolled_count: number;
  completion_rate: number;
  is_certified: boolean;
  last_updated: string;
}

export interface HiringTrendRecord {
  trend_id: string;
  month: string;
  category_code: string;
  location_code: string;
  jobs_posted: number;
  applications_received: number;
  offers_made: number;
  avg_time_to_hire_days: number;
  demand_index: number;
  last_updated: string;
}

export interface LearningEnrollmentRecord {
  enrollment_id: string;
  student_id: string;
  course_id: string;
  skill_id: string;
  enrolled_at: string;
  completed_at: string | null;
  progress_pct: number;
  hours_spent: number;
  score: number | null;
  last_updated: string;
}

export interface StudentCertificationRecord {
  student_certification_id: string;
  student_id: string;
  certification_id: string;
  issued_at: string;
  expires_at: string;
  verified: boolean;
  last_updated: string;
}

export interface SyntheticDatasets {
  job_categories: JobCategoryRecord[];
  locations: LocationRecord[];
  technologies: TechnologyRecord[];
  experience_levels: ExperienceLevelRecord[];
  employment_types: EmploymentTypeRecord[];
  skills: SkillRecord[];
  certifications: CertificationRecord[];
  colleges: CollegeRecord[];
  students: StudentRecord[];
  companies: CompanyRecord[];
  recruiters: RecruiterRecord[];
  jobs: JobRecord[];
  internships: InternshipRecord[];
  applications: ApplicationRecord[];
  interviews: InterviewRecord[];
  placements: PlacementRecord[];
  salaries: SalaryRecord[];
  courses: CourseRecord[];
  hiring_trends: HiringTrendRecord[];
  learning_enrollments: LearningEnrollmentRecord[];
  student_certifications: StudentCertificationRecord[];
}

export type DatasetName = keyof SyntheticDatasets;
