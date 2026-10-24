import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Exercise 6(B) - Three Tier Application Using JSP and Database
 * Data Access Layer: CareerProfileDAO
 * Author: Kalaiyarasan K (9943)
 */
public class CareerProfileDAO {
    // Default connection settings from lab manual with secure environment override
    private static final String DEFAULT_URL = 
        System.getenv("DB_URL") != null 
            ? System.getenv("DB_URL") 
            : (System.getenv("JDBC_URL") != null 
                ? System.getenv("JDBC_URL") 
                : "jdbc:sqlserver://103.207.1.91:1433;databaseName=CSE9943;encrypt=true;trustServerCertificate=true");

    private static final String DEFAULT_USER = 
        System.getenv("DB_USER") != null 
            ? System.getenv("DB_USER") 
            : (System.getenv("DATABASE_USER") != null 
                ? System.getenv("DATABASE_USER") 
                : "MZ");

    private static final String DEFAULT_PASS = 
        System.getenv("DB_PASSWORD") != null 
            ? System.getenv("DB_PASSWORD") 
            : (System.getenv("DATABASE_PASSWORD") != null 
                ? System.getenv("DATABASE_PASSWORD") 
                : "mzcet@1234");

    private String url;
    private String username;
    private String password;

    public CareerProfileDAO() {
        this(DEFAULT_URL, DEFAULT_USER, DEFAULT_PASS);
    }

    public CareerProfileDAO(String url, String username, String password) {
        this.url = url;
        this.username = username;
        this.password = password;
    }

    private Connection getConnection() throws SQLException, ClassNotFoundException {
        // Detect driver based on JDBC URL
        if (url.startsWith("jdbc:sqlserver:")) {
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
        } else if (url.startsWith("jdbc:sqlite:")) {
            Class.forName("org.sqlite.JDBC");
        } else if (url.startsWith("jdbc:postgresql:")) {
            Class.forName("org.postgresql.Driver");
        } else if (url.startsWith("jdbc:mysql:")) {
            Class.forName("com.mysql.cj.jdbc.Driver");
        }
        return DriverManager.getConnection(url, username, password);
    }

    public boolean saveProfile(CareerProfile p) {
        // Enforce single primary profile per user/email (prevent duplicate rows on repeated submissions)
        CareerProfile existing = getProfileByEmail(p.getEmail());
        if (existing != null) {
            String updateSql = "UPDATE CareerProfiles SET name = ?, phone = ?, education = ?, skills = ?, careerGoal = ?, experience = ?, goals = ? WHERE id = ?";
            try (Connection con = getConnection();
                 PreparedStatement ps = con.prepareStatement(updateSql)) {
                ps.setString(1, p.getName());
                ps.setString(2, p.getPhone());
                ps.setString(3, p.getEducation());
                ps.setString(4, p.getSkills());
                ps.setString(5, p.getCareerGoal());
                ps.setString(6, p.getExperience());
                ps.setString(7, p.getGoals());
                ps.setInt(8, existing.getId());

                int updated = ps.executeUpdate();
                if (updated > 0) {
                    p.setId(existing.getId());
                    return true;
                }
            } catch (Exception e) {
                System.err.println("Database update error in CareerProfileDAO.saveProfile: " + e.getMessage());
            }
        }

        String sql = "INSERT INTO CareerProfiles(name, email, phone, education, skills, careerGoal, experience, goals) "
                   + "VALUES(?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection con = getConnection();
             PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            ps.setString(1, p.getName());
            ps.setString(2, p.getEmail());
            ps.setString(3, p.getPhone());
            ps.setString(4, p.getEducation());
            ps.setString(5, p.getSkills());
            ps.setString(6, p.getCareerGoal());
            ps.setString(7, p.getExperience());
            ps.setString(8, p.getGoals());

            int result = ps.executeUpdate();
            if (result > 0) {
                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (rs.next()) {
                        p.setId(rs.getInt(1));
                    }
                }
                return true;
            }
            return false;
        } catch (Exception e) {
            System.err.println("Database insertion error in CareerProfileDAO: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public CareerProfile getProfileById(int id) {
        String sql = "SELECT id, name, email, phone, education, skills, careerGoal, experience, goals FROM CareerProfiles WHERE id = ?";
        try (Connection con = getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    CareerProfile p = new CareerProfile(
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        rs.getString("education"),
                        rs.getString("skills"),
                        rs.getString("careerGoal"),
                        rs.getString("experience"),
                        rs.getString("goals")
                    );
                    p.setId(rs.getInt("id"));
                    return p;
                }
            }
        } catch (Exception e) {
            System.err.println("Database query error in CareerProfileDAO.getProfileById: " + e.getMessage());
        }
        return null;
    }

    public CareerProfile getProfileByEmail(String email) {
        String sql = (url != null && url.contains("sqlserver"))
            ? "SELECT TOP 1 id, name, email, phone, education, skills, careerGoal, experience, goals FROM CareerProfiles WHERE email = ? ORDER BY id DESC"
            : "SELECT id, name, email, phone, education, skills, careerGoal, experience, goals FROM CareerProfiles WHERE email = ? ORDER BY id DESC LIMIT 1";
        try (Connection con = getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    CareerProfile p = new CareerProfile(
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        rs.getString("education"),
                        rs.getString("skills"),
                        rs.getString("careerGoal"),
                        rs.getString("experience"),
                        rs.getString("goals")
                    );
                    p.setId(rs.getInt("id"));
                    return p;
                }
            }
        } catch (Exception e) {
            System.err.println("Database query error in CareerProfileDAO.getProfileByEmail: " + e.getMessage());
        }
        return null;
    }

    public CareerProfile getLatestProfile() {
        String sql = (url != null && url.contains("sqlserver"))
            ? "SELECT TOP 1 id, name, email, phone, education, skills, careerGoal, experience, goals FROM CareerProfiles ORDER BY id DESC"
            : "SELECT id, name, email, phone, education, skills, careerGoal, experience, goals FROM CareerProfiles ORDER BY id DESC LIMIT 1";
        try (Connection con = getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                CareerProfile p = new CareerProfile(
                    rs.getString("name"),
                    rs.getString("email"),
                    rs.getString("phone"),
                    rs.getString("education"),
                    rs.getString("skills"),
                    rs.getString("careerGoal"),
                    rs.getString("experience"),
                    rs.getString("goals")
                );
                p.setId(rs.getInt("id"));
                return p;
            }
        } catch (Exception e) {
            System.err.println("Database query error in CareerProfileDAO.getLatestProfile: " + e.getMessage());
        }
        return null;
    }

    public List<CareerProfile> getAllProfiles() {
        List<CareerProfile> list = new ArrayList<>();
        String sql = "SELECT id, name, email, phone, education, skills, careerGoal, experience, goals FROM CareerProfiles";
        try (Connection con = getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            
            while (rs.next()) {
                CareerProfile p = new CareerProfile(
                    rs.getString("name"),
                    rs.getString("email"),
                    rs.getString("phone"),
                    rs.getString("education"),
                    rs.getString("skills"),
                    rs.getString("careerGoal"),
                    rs.getString("experience"),
                    rs.getString("goals")
                );
                p.setId(rs.getInt("id"));
                list.add(p);
            }
        } catch (Exception e) {
            System.err.println("Database query error in CareerProfileDAO: " + e.getMessage());
        }
        return list;
    }
}
