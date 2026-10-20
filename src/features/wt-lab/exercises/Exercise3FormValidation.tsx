import { useState } from "react";
import { LabHeader } from "../components/LabHeader";
import { WT_EXERCISES } from "../data/exercises";
import { CheckCircle2, AlertCircle, RefreshCw, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormData {
  name: string;
  email: string;
  phone: string;
  education: string;
  skills: string;
  careerGoal: string;
  experience: string;
  goals: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  education?: string;
  skills?: string;
  careerGoal?: string;
  experience?: string;
  goals?: string;
}

const INITIAL_FORM: FormData = {
  name: "",
  email: "",
  phone: "",
  education: "",
  skills: "",
  careerGoal: "",
  experience: "",
  goals: "",
};

export function Exercise3FormValidation() {
  const ex = WT_EXERCISES.find((e) => e.id === "ex-3")!;
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submittedProfile, setSubmittedProfile] = useState<FormData | null>(null);

  const handleNameChange = (val: string) => {
    // DHTML rule: oninput="this.value = this.value.replace(/[^A-Za-z ]/g, '')"
    const filtered = val.replace(/[^A-Za-z ]/g, "");
    setFormData((prev) => ({ ...prev, name: filtered }));
    if (errors.name) {
      setErrors((prev) => {
        const { name: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handlePhoneChange = (val: string) => {
    // DHTML rule: oninput="this.value = this.value.replace(/[^0-9]/g, '')" with maxlength=10
    const filtered = val.replace(/[^0-9]/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: filtered }));
    if (errors.phone) {
      setErrors((prev) => {
        const { phone: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleChange = (field: keyof FormData, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: FormErrors = {};

    // 1. Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Please enter your full name.";
      isValid = false;
    }

    // 2. Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Please enter your email address.";
      isValid = false;
    } else if (!formData.email.includes("@")) {
      newErrors.email = "Please enter a valid email address.";
      isValid = false;
    }

    // 3. Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Please enter your phone number.";
      isValid = false;
    } else if (formData.phone.length !== 10) {
      newErrors.phone = "Phone number must contain 10 digits.";
      isValid = false;
    }

    // 4. Education validation
    if (!formData.education) {
      newErrors.education = "Please select your education.";
      isValid = false;
    }

    // 5. Skills validation
    if (!formData.skills.trim()) {
      newErrors.skills = "Please enter your skills.";
      isValid = false;
    }

    // 6. Career Goal validation
    if (!formData.careerGoal) {
      newErrors.careerGoal = "Please select your career goal.";
      isValid = false;
    }

    // 7. Experience validation
    if (!formData.experience) {
      newErrors.experience = "Please select your experience.";
      isValid = false;
    }

    // 8. Goals validation
    if (!formData.goals.trim()) {
      newErrors.goals = "Please enter your career goals.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (validateForm()) {
      setSuccessMessage("Career Profile Created Successfully!");
      setSubmittedProfile({ ...formData });
    }
  };

  const fillValidData = () => {
    setFormData({
      name: "Alex Morgan",
      email: "alex.morgan@example.com",
      phone: "9876543210",
      education: "BE",
      skills: "HTML, CSS, JavaScript, React, Java, SQL",
      careerGoal: "software",
      experience: "fresher",
      goals:
        "To become a senior cloud and full-stack software architect building intelligent career systems.",
    });
    setErrors({});
    setSuccessMessage(null);
  };

  const fillInvalidData = () => {
    setFormData({
      name: "",
      email: "invalid-email-without-at",
      phone: "12345", // less than 10 digits
      education: "",
      skills: "",
      careerGoal: "",
      experience: "",
      goals: "",
    });
    setErrors({});
    setSuccessMessage(null);
    setSubmittedProfile(null);
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setSuccessMessage(null);
    setSubmittedProfile(null);
  };

  return (
    <div className="space-y-6">
      <LabHeader
        number={ex.number}
        title={ex.title}
        description={ex.description}
        technologies={ex.technologies}
        status={ex.status}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Validation Form Card */}
        <div className="surface-card p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Career Profile Registration Portal
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Client-side validated candidate registration portal with live error feedback and character masking.
              </p>
            </div>

              {/* Lab Test Quick Actions */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={fillValidData} className="h-7 text-xs">
                  Fill Valid Data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fillInvalidData}
                  className="h-7 text-xs text-destructive hover:text-destructive"
                >
                  Fill Invalid Data
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-7 px-2 text-xs"
                >
                  <RefreshCw className="size-3" />
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Full Name <span className="text-destructive">*</span>
                  <span className="ml-2 font-normal text-[11px] text-muted-foreground">
                    (Letters and spaces only)
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter your full name"
                  className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors ${
                    errors.name
                      ? "border-destructive ring-1 ring-destructive/40"
                      : "border-input focus:border-primary"
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="size-3" /> {errors.name}
                  </p>
                )}
              </div>

              {/* Email & Phone Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Email Address <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="Enter your email"
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors ${
                      errors.email
                        ? "border-destructive ring-1 ring-destructive/40"
                        : "border-input focus:border-primary"
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="size-3" /> {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Phone Number <span className="text-destructive">*</span>
                    <span className="ml-2 font-normal text-[11px] text-muted-foreground">
                      (10 digits)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="10-digit number"
                    maxLength={10}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors ${
                      errors.phone
                        ? "border-destructive ring-1 ring-destructive/40"
                        : "border-input focus:border-primary"
                    }`}
                  />
                  {errors.phone && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="size-3" /> {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Education & Career Goal Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Education <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formData.education}
                    onChange={(e) => handleChange("education", e.target.value)}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors ${
                      errors.education
                        ? "border-destructive ring-1 ring-destructive/40"
                        : "border-input focus:border-primary"
                    }`}
                  >
                    <option value="">Select Education</option>
                    <option value="BE">B.E / B.Tech</option>
                    <option value="ME">M.E / M.Tech</option>
                    <option value="BSC">B.Sc</option>
                    <option value="MSC">M.Sc</option>
                    <option value="MBA">MBA</option>
                  </select>
                  {errors.education && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="size-3" /> {errors.education}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Career Goal <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formData.careerGoal}
                    onChange={(e) => handleChange("careerGoal", e.target.value)}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors ${
                      errors.careerGoal
                        ? "border-destructive ring-1 ring-destructive/40"
                        : "border-input focus:border-primary"
                    }`}
                  >
                    <option value="">Select Career Goal</option>
                    <option value="software">Software Developer</option>
                    <option value="data">Data Analyst</option>
                    <option value="dataengineer">Data Engineer</option>
                    <option value="ai">AI / ML Engineer</option>
                    <option value="web">Web Developer</option>
                  </select>
                  {errors.careerGoal && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="size-3" /> {errors.careerGoal}
                    </p>
                  )}
                </div>
              </div>

              {/* Skills & Experience Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Skills <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => handleChange("skills", e.target.value)}
                    placeholder="e.g. HTML, CSS, JavaScript, Python"
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors ${
                      errors.skills
                        ? "border-destructive ring-1 ring-destructive/40"
                        : "border-input focus:border-primary"
                    }`}
                  />
                  {errors.skills && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="size-3" /> {errors.skills}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Experience <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formData.experience}
                    onChange={(e) => handleChange("experience", e.target.value)}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors ${
                      errors.experience
                        ? "border-destructive ring-1 ring-destructive/40"
                        : "border-input focus:border-primary"
                    }`}
                  >
                    <option value="">Select Experience</option>
                    <option value="fresher">Fresher</option>
                    <option value="0-2">0 - 2 Years</option>
                    <option value="2-5">2 - 5 Years</option>
                    <option value="5+">5+ Years</option>
                  </select>
                  {errors.experience && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="size-3" /> {errors.experience}
                    </p>
                  )}
                </div>
              </div>

              {/* Career Goals Textarea */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Career Goals Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={formData.goals}
                  onChange={(e) => handleChange("goals", e.target.value)}
                  placeholder="Enter your target career milestones and aspirations"
                  rows={3}
                  className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors ${
                    errors.goals
                      ? "border-destructive ring-1 ring-destructive/40"
                      : "border-input focus:border-primary"
                  }`}
                />
                {errors.goals && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="size-3" /> {errors.goals}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full gap-2 bg-[#238636] hover:bg-[#176b2c] text-white"
              >
                <Send className="size-4" /> Create Career Profile (DHTML Submit)
              </Button>

              {/* Success Notification */}
              {successMessage && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="size-5" />
                  {successMessage}
                </div>
              )}
            </form>
          </div>

          {/* Validation Checklist & Live Card Preview */}
          <div className="space-y-6 lg:col-span-5">
            {/* Rules Checklist */}
            <div className="surface-card p-6">
              <h4 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">
                DHTML Validation Checklist
              </h4>
              <ul className="mt-3 space-y-2 text-xs">
                <li className="flex items-center gap-2">
                  <span
                    className={`grid size-4 place-items-center rounded-full text-[10px] ${formData.name.trim() ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    ✓
                  </span>
                  <span>Full name: required & letters only</span>
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className={`grid size-4 place-items-center rounded-full text-[10px] ${formData.email.includes("@") ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    ✓
                  </span>
                  <span>
                    Email: must include <code className="bg-muted px-1 rounded">@</code> symbol
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className={`grid size-4 place-items-center rounded-full text-[10px] ${formData.phone.length === 10 ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    ✓
                  </span>
                  <span>Phone: exactly 10 numeric digits</span>
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className={`grid size-4 place-items-center rounded-full text-[10px] ${formData.education ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    ✓
                  </span>
                  <span>Education: selected option</span>
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className={`grid size-4 place-items-center rounded-full text-[10px] ${formData.careerGoal ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    ✓
                  </span>
                  <span>Career Goal: selected target role</span>
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className={`grid size-4 place-items-center rounded-full text-[10px] ${formData.experience ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    ✓
                  </span>
                  <span>Experience: selected experience level</span>
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className={`grid size-4 place-items-center rounded-full text-[10px] ${formData.goals.trim() ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    ✓
                  </span>
                  <span>Career Goals: non-empty description</span>
                </li>
              </ul>
            </div>

            {/* Generated Profile Preview Card */}
            {submittedProfile ? (
              <div className="surface-card p-6 border-l-4 border-l-emerald-500">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">
                    Validated Profile Card
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <Check className="size-3" /> Validated
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    <strong className="text-foreground">{submittedProfile.name}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    <strong className="text-foreground">{submittedProfile.email}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{" "}
                    <strong className="text-foreground">{submittedProfile.phone}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Education:</span>{" "}
                    <strong className="text-foreground">{submittedProfile.education}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Skills:</span>{" "}
                    <strong className="text-foreground">{submittedProfile.skills}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target Role:</span>{" "}
                    <strong className="text-foreground capitalize">
                      {submittedProfile.careerGoal}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Experience:</span>{" "}
                    <strong className="text-foreground capitalize">
                      {submittedProfile.experience}
                    </strong>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <span className="text-muted-foreground block mb-0.5">Career Goals:</span>
                    <p className="text-foreground/90 italic bg-muted/40 p-2 rounded">
                      "{submittedProfile.goals}"
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                Fill the form and submit to view the validated career profile card.
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
