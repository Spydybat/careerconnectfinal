export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_interview_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          difficulty: string
          id: string
          overall_score: number | null
          role_title: string
          status: string
          summary: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          overall_score?: number | null
          role_title?: string
          status?: string
          summary?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          overall_score?: number | null
          role_title?: string
          status?: string
          summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_interview_turns: {
        Row: {
          answer: string | null
          category: string
          created_at: string
          feedback: Json
          id: string
          question: string
          score: number | null
          seq: number
          session_id: string
        }
        Insert: {
          answer?: string | null
          category?: string
          created_at?: string
          feedback?: Json
          id?: string
          question: string
          score?: number | null
          seq?: number
          session_id: string
        }
        Update: {
          answer?: string | null
          category?: string
          created_at?: string
          feedback?: Json
          id?: string
          question?: string
          score?: number | null
          seq?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_interview_turns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          role?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_skill_gap_reports: {
        Row: {
          career_id: string | null
          career_title: string
          created_at: string
          gaps: Json
          id: string
          plan: Json
          readiness_score: number
          summary: string | null
          user_id: string
        }
        Insert: {
          career_id?: string | null
          career_title?: string
          created_at?: string
          gaps?: Json
          id?: string
          plan?: Json
          readiness_score?: number
          summary?: string | null
          user_id: string
        }
        Update: {
          career_id?: string | null
          career_title?: string
          created_at?: string
          gaps?: Json
          id?: string
          plan?: Json
          readiness_score?: number
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_skill_gap_reports_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          created_at: string
          error_message: string | null
          estimated_cost_usd: number
          feature: string
          id: string
          input_tokens: number
          latency_ms: number
          model: string | null
          output_tokens: number
          provider: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          estimated_cost_usd?: number
          feature: string
          id?: string
          input_tokens?: number
          latency_ms?: number
          model?: string | null
          output_tokens?: number
          provider?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          estimated_cost_usd?: number
          feature?: string
          id?: string
          input_tokens?: number
          latency_ms?: number
          model?: string | null
          output_tokens?: number
          provider?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      application_events: {
        Row: {
          actor_id: string | null
          application_id: string
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          to_status: string
        }
        Insert: {
          actor_id?: string | null
          application_id: string
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status: string
        }
        Update: {
          actor_id?: string | null
          application_id?: string
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applied_at: string
          cover_note: string | null
          id: string
          job_id: string
          match_score: number | null
          resume_id: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          applied_at?: string
          cover_note?: string | null
          id?: string
          job_id: string
          match_score?: number | null
          resume_id?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          applied_at?: string
          cover_note?: string | null
          id?: string
          job_id?: string
          match_score?: number | null
          resume_id?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          category: string
          company_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_hash: string | null
          metadata: Json
          occurred_at: string
          outcome: string
          request_id: string | null
          severity: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          category?: string
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_hash?: string | null
          metadata?: Json
          occurred_at?: string
          outcome?: string
          request_id?: string | null
          severity?: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          category?: string
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_hash?: string | null
          metadata?: Json
          occurred_at?: string
          outcome?: string
          request_id?: string | null
          severity?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      career_skills: {
        Row: {
          career_id: string
          importance: number
          skill_id: string
        }
        Insert: {
          career_id: string
          importance?: number
          skill_id: string
        }
        Update: {
          career_id?: string
          importance?: number
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_skills_career_id_fkey"
            columns: ["career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      careers: {
        Row: {
          avg_salary_max: number | null
          avg_salary_min: number | null
          created_at: string
          demand_score: number
          description: string | null
          id: string
          learning_path: Json
          slug: string
          summary: string
          title: string
        }
        Insert: {
          avg_salary_max?: number | null
          avg_salary_min?: number | null
          created_at?: string
          demand_score?: number
          description?: string | null
          id?: string
          learning_path?: Json
          slug: string
          summary?: string
          title: string
        }
        Update: {
          avg_salary_max?: number | null
          avg_salary_min?: number | null
          created_at?: string
          demand_score?: number
          description?: string | null
          id?: string
          learning_path?: Json
          slug?: string
          summary?: string
          title?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          description: string | null
          headquarters: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          slug: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          slug: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          slug?: string
          website?: string | null
        }
        Relationships: []
      }
      education: {
        Row: {
          created_at: string
          degree: string | null
          end_year: number | null
          field_of_study: string | null
          grade: string | null
          id: string
          institution: string
          start_year: number | null
          student_id: string
        }
        Insert: {
          created_at?: string
          degree?: string | null
          end_year?: number | null
          field_of_study?: string | null
          grade?: string | null
          id?: string
          institution: string
          start_year?: number | null
          student_id: string
        }
        Update: {
          created_at?: string
          degree?: string | null
          end_year?: number | null
          field_of_study?: string | null
          grade?: string | null
          id?: string
          institution?: string
          start_year?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          application_id: string
          created_at: string
          feedback: string | null
          id: string
          mode: string
          rating: number | null
          round_name: string
          scheduled_at: string | null
          status: string
        }
        Insert: {
          application_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          mode?: string
          rating?: number | null
          round_name?: string
          scheduled_at?: string | null
          status?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          mode?: string
          rating?: number | null
          round_name?: string
          scheduled_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      job_skills: {
        Row: {
          importance: number
          job_id: string
          skill_id: string
        }
        Insert: {
          importance?: number
          job_id: string
          skill_id: string
        }
        Update: {
          importance?: number
          job_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          closes_at: string | null
          company_id: string
          created_at: string
          description: string
          employment_type: string
          experience_level: string
          id: string
          location: string | null
          openings: number
          posted_by: string | null
          salary_max: number | null
          salary_min: number | null
          status: string
          title: string
          updated_at: string
          work_mode: string
        }
        Insert: {
          closes_at?: string | null
          company_id: string
          created_at?: string
          description?: string
          employment_type?: string
          experience_level?: string
          id?: string
          location?: string | null
          openings?: number
          posted_by?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          title: string
          updated_at?: string
          work_mode?: string
        }
        Update: {
          closes_at?: string | null
          company_id?: string
          created_at?: string
          description?: string
          employment_type?: string
          experience_level?: string
          id?: string
          location?: string | null
          openings?: number
          posted_by?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          title?: string
          updated_at?: string
          work_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          application_id: string
          created_at: string
          ctc: number | null
          id: string
          joining_date: string | null
          role_title: string | null
          status: string
        }
        Insert: {
          application_id: string
          created_at?: string
          ctc?: number | null
          id?: string
          joining_date?: string | null
          role_title?: string | null
          status?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          ctc?: number | null
          id?: string
          joining_date?: string | null
          role_title?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      placements: {
        Row: {
          academic_year: string | null
          application_id: string | null
          company_id: string | null
          created_at: string
          ctc: number | null
          id: string
          placement_date: string
          role_title: string
          student_id: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          academic_year?: string | null
          application_id?: string | null
          company_id?: string | null
          created_at?: string
          ctc?: number | null
          id?: string
          placement_date?: string
          role_title: string
          student_id: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          academic_year?: string | null
          application_id?: string | null
          company_id?: string | null
          created_at?: string
          ctc?: number | null
          id?: string
          placement_date?: string
          role_title?: string
          student_id?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "placements_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          headline: string | null
          id: string
          location: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          headline?: string | null
          id: string
          location?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          headline?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          student_id: string
          tech_stack: string | null
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          student_id: string
          tech_stack?: string | null
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          student_id?: string
          tech_stack?: string | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiters: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          job_title: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          job_title?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          job_title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiters_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          ai_recommendations: Json | null
          ai_score: number | null
          ai_summary: string | null
          analyzed_at: string | null
          ats_score: number | null
          created_at: string
          education_items: Json
          experience: Json
          extracted_skills: Json
          file_path: string | null
          id: string
          improvements: Json
          is_primary: boolean
          missing_skills: Json
          parent_resume_id: string | null
          raw_text: string | null
          strengths: Json
          student_id: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          ai_recommendations?: Json | null
          ai_score?: number | null
          ai_summary?: string | null
          analyzed_at?: string | null
          ats_score?: number | null
          created_at?: string
          education_items?: Json
          experience?: Json
          extracted_skills?: Json
          file_path?: string | null
          id?: string
          improvements?: Json
          is_primary?: boolean
          missing_skills?: Json
          parent_resume_id?: string | null
          raw_text?: string | null
          strengths?: Json
          student_id: string
          title?: string
          updated_at?: string
          version?: number
        }
        Update: {
          ai_recommendations?: Json | null
          ai_score?: number | null
          ai_summary?: string | null
          analyzed_at?: string | null
          ats_score?: number | null
          created_at?: string
          education_items?: Json
          experience?: Json
          extracted_skills?: Json
          file_path?: string | null
          id?: string
          improvements?: Json
          is_primary?: boolean
          missing_skills?: Json
          parent_resume_id?: string | null
          raw_text?: string | null
          strengths?: Json
          student_id?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "resumes_parent_resume_id_fkey"
            columns: ["parent_resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resumes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_jobs: {
        Row: {
          created_at: string
          id: string
          job_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_jobs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_categories: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "skill_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      student_skills: {
        Row: {
          created_at: string
          id: string
          proficiency: number
          skill_id: string
          source: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          proficiency?: number
          skill_id: string
          source?: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          proficiency?: number
          skill_id?: string
          source?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_skills_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          about: string | null
          branch: string | null
          cgpa: number | null
          college: string | null
          created_at: string
          degree: string | null
          graduation_year: number | null
          id: string
          open_to_work: boolean
          target_career_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          about?: string | null
          branch?: string | null
          cgpa?: number | null
          college?: string | null
          created_at?: string
          degree?: string | null
          graduation_year?: number | null
          id?: string
          open_to_work?: boolean
          target_career_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          about?: string | null
          branch?: string | null
          cgpa?: number | null
          college?: string | null
          created_at?: string
          degree?: string | null
          graduation_year?: number | null
          id?: string
          open_to_work?: boolean
          target_career_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_target_career_id_fkey"
            columns: ["target_career_id"]
            isOneToOne: false
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      job_is_mine: { Args: { _job_id: string }; Returns: boolean }
      my_company_id: { Args: never; Returns: string }
      owns_conversation: {
        Args: { _conversation_id: string }
        Returns: boolean
      }
      owns_interview_session: {
        Args: { _session_id: string }
        Returns: boolean
      }
      owns_student: { Args: { _student_id: string }; Returns: boolean }
      student_applied_to_me: { Args: { _student_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "student" | "recruiter" | "placement_officer" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "recruiter", "placement_officer", "admin"],
    },
  },
} as const
