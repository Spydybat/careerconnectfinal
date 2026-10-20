export type LabTechnology =
  | "HTML"
  | "CSS"
  | "JavaScript"
  | "DHTML"
  | "Tomcat"
  | "Servlet"
  | "Session"
  | "JSP"
  | "JDBC"
  | "SQL Server"
  | "XML"
  | "XSD"
  | "XSL"
  | "Interactive Map"
  | "Design Tokens"
  | "Client Validation"
  | "Server Infrastructure"
  | "HTTP Dispatch"
  | "Session Tracking"
  | "State Management"
  | "SQL Database"
  | "MVC Architecture"
  | "XSD Schema"
  | "XSLT Transform";

export type ExerciseStatus =
  | "Implemented"
  | "Tested"
  | "Build-Verified"
  | "Active";

export interface CodeFile {
  name: string;
  language: string;
  code: string;
  description?: string;
}

export interface WTExercise {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  technologies: LabTechnology[];
  status: ExerciseStatus;
  route: string;
  files: CodeFile[];
  procedures?: string[];
  sqlQueries?: string[];
}
