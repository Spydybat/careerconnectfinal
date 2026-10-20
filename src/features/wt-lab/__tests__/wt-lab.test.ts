import { describe, it, expect } from "vitest";
import { WT_EXERCISES } from "../data/exercises";

describe("Web Technology Lab Suite", () => {
  describe("Exercise Inventory Integrity", () => {
    it("contains all 9 required lab exercise modules (Ex 1 to 7 including 5A, 5B, 6A, 6B)", () => {
      const exerciseIds = WT_EXERCISES.map((e) => e.id);
      expect(exerciseIds).toEqual([
        "ex-1",
        "ex-2",
        "ex-3",
        "ex-4",
        "ex-5a",
        "ex-5b",
        "ex-6a",
        "ex-6b",
        "ex-7",
      ]);
    });

    it("verifies every exercise has a unique valid route matching /wt-lab", () => {
      const routes = WT_EXERCISES.map((e) => e.route);
      const uniqueRoutes = new Set(routes);
      expect(uniqueRoutes.size).toBe(WT_EXERCISES.length);
      for (const route of routes) {
        expect(route.startsWith("/wt-lab/")).toBe(true);
      }
    });

    it("verifies all exercises have non-empty source files and valid status", () => {
      for (const ex of WT_EXERCISES) {
        expect(ex.status).toBe("Tested");
        expect(ex.files.length).toBeGreaterThan(0);
        for (const file of ex.files) {
          expect(file.name.length).toBeGreaterThan(0);
          expect(file.code.trim().length).toBeGreaterThan(0);
          expect(file.language.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("Exercise 3: Client-Side DHTML Form Validation Rules", () => {
    interface FormTestErrors {
      name?: string;
      email?: string;
      phone?: string;
      education?: string;
      skills?: string;
      careerGoal?: string;
      experience?: string;
      goals?: string;
    }

    function validateInput(formData: {
      name: string;
      email: string;
      phone: string;
      education: string;
      skills: string;
      careerGoal: string;
      experience: string;
      goals: string;
    }) {
      const errors: FormTestErrors = {};

      if (!formData.name.trim()) errors.name = "Please enter your full name.";
      if (!formData.email.trim()) errors.email = "Please enter your email address.";
      else if (!formData.email.includes("@")) errors.email = "Please enter a valid email address.";

      if (!formData.phone.trim()) errors.phone = "Please enter your phone number.";
      else if (formData.phone.length !== 10) errors.phone = "Phone number must contain 10 digits.";

      if (!formData.education) errors.education = "Please select your education.";
      if (!formData.skills.trim()) errors.skills = "Please enter your skills.";
      if (!formData.careerGoal) errors.careerGoal = "Please select your career goal.";
      if (!formData.experience) errors.experience = "Please select your experience.";
      if (!formData.goals.trim()) errors.goals = "Please enter your career goals.";

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    }

    it("accepts valid form submissions meeting all DHTML rules", () => {
      const validData = {
        name: "Kalaiyarasan K",
        email: "kalaiyarasan@gmail.com",
        phone: "9876543210",
        education: "BE",
        skills: "HTML, CSS, JavaScript, Java",
        careerGoal: "software",
        experience: "fresher",
        goals: "Become a lead architect.",
      };
      const result = validateInput(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("rejects phone numbers with length not equal to 10", () => {
      const shortPhone = {
        name: "Kalaiyarasan K",
        email: "kalaiyarasan@gmail.com",
        phone: "98765", // 5 digits
        education: "BE",
        skills: "Java",
        careerGoal: "software",
        experience: "fresher",
        goals: "Build apps",
      };
      const result = validateInput(shortPhone);
      expect(result.isValid).toBe(false);
      expect(result.errors.phone).toBe("Phone number must contain 10 digits.");
    });

    it("rejects emails without '@' symbol", () => {
      const invalidEmail = {
        name: "Kalaiyarasan K",
        email: "kalaiyarasangmail.com",
        phone: "9876543210",
        education: "BE",
        skills: "Java",
        careerGoal: "software",
        experience: "fresher",
        goals: "Build apps",
      };
      const result = validateInput(invalidEmail);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe("Please enter a valid email address.");
    });

    it("filters non-alphabetic characters in full name per DHTML regex", () => {
      const rawInput = "Kalaiyarasan 123 !@#";
      const sanitized = rawInput.replace(/[^A-Za-z ]/g, "");
      expect(sanitized).toBe("Kalaiyarasan  ");
    });
  });

  describe("Exercise 6(A) & 6(B): Database Schema Alignment", () => {
    it("ensures required database columns match in CareerProfiles definition", () => {
      const requiredColumns = [
        "name",
        "email",
        "phone",
        "education",
        "skills",
        "careerGoal",
        "experience",
        "goals",
      ];
      const ex6a = WT_EXERCISES.find((e) => e.id === "ex-6a")!;
      const ddl = ex6a.sqlQueries![0];
      for (const col of requiredColumns) {
        expect(ddl).toContain(col);
      }
    });
  });

  describe("Exercise 7: XML Schema & Data Contract", () => {
    it("verifies XML sample contains profile tags with valid integer profileId and elements", () => {
      const ex7 = WT_EXERCISES.find((e) => e.id === "ex-7")!;
      const xmlFile = ex7.files.find((f) => f.name === "career.xml")!;
      const xsdFile = ex7.files.find((f) => f.name === "career.xsd")!;
      const xslFile = ex7.files.find((f) => f.name === "career.xsl")!;

      expect(xmlFile).toBeDefined();
      expect(xsdFile).toBeDefined();
      expect(xslFile).toBeDefined();

      expect(xmlFile.code).toContain("<careerConnect>");
      expect(xmlFile.code).toContain("<profileId>1001</profileId>");
      expect(xsdFile.code).toContain('<xs:element name="profileId" type="xs:integer"/>');
      expect(xslFile.code).toContain('<xsl:for-each select="careerConnect/profile">');
    });
  });
});
