import java.io.Serializable;
import java.sql.Timestamp;

/**
 * Career Connect - User Account Model
 * Represents an authenticated principal (Candidate, Administrator, Employer/Recruiter).
 * Author: Kalaiyarasan K (9943)
 */
public class UserAccount implements Serializable {
    private static final long serialVersionUID = 1L;

    private int id;
    private String fullName;
    private String email;
    private String passwordHash;
    private String passwordSalt;
    private String role; // 'candidate', 'admin', 'employer'
    private String organization;
    private String status; // 'active', 'suspended', 'pending'
    private int failedLoginAttempts;
    private Timestamp lockoutUntil;
    private Timestamp lastLoginAt;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    public UserAccount() {
        this.role = "candidate";
        this.status = "active";
        this.failedLoginAttempts = 0;
    }

    public UserAccount(String fullName, String email, String role, String organization) {
        this();
        this.fullName = fullName;
        this.email = email;
        this.role = role != null ? role.toLowerCase() : "candidate";
        this.organization = organization;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getPasswordSalt() { return passwordSalt; }
    public void setPasswordSalt(String passwordSalt) { this.passwordSalt = passwordSalt; }

    public String getRole() { return role; }
    public void setRole(String role) { 
        if (role != null) {
            this.role = role.trim().toLowerCase();
        }
    }

    public String getOrganization() { return organization; }
    public void setOrganization(String organization) { this.organization = organization; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getFailedLoginAttempts() { return failedLoginAttempts; }
    public void setFailedLoginAttempts(int failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; }

    public Timestamp getLockoutUntil() { return lockoutUntil; }
    public void setLockoutUntil(Timestamp lockoutUntil) { this.lockoutUntil = lockoutUntil; }

    public Timestamp getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(Timestamp lastLoginAt) { this.lastLoginAt = lastLoginAt; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }

    public boolean isLockedOut() {
        if (lockoutUntil == null) return false;
        return lockoutUntil.after(new Timestamp(System.currentTimeMillis()));
    }

    /**
     * Serializes public profile attributes into JSON, omitting security secrets.
     */
    public String toJson() {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":").append(id).append(",");
        sb.append("\"fullName\":\"").append(escapeJson(fullName)).append("\",");
        sb.append("\"email\":\"").append(escapeJson(email)).append("\",");
        sb.append("\"role\":\"").append(escapeJson(role)).append("\",");
        sb.append("\"organization\":").append(organization != null ? "\"" + escapeJson(organization) + "\"" : "null").append(",");
        sb.append("\"status\":\"").append(escapeJson(status)).append("\",");
        sb.append("\"lastLoginAt\":").append(lastLoginAt != null ? "\"" + lastLoginAt.toString() + "\"" : "null").append(",");
        sb.append("\"createdAt\":").append(createdAt != null ? "\"" + createdAt.toString() + "\"" : "null");
        sb.append("}");
        return sb.toString();
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
