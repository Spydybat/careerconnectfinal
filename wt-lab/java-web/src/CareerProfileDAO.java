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
            : "jdbc:sqlserver://103.207.1.91:1433;databaseName=CSE9596;encrypt=true;trustServerCertificate=true";

    private static final String DEFAULT_USER = 
        System.getenv("DB_USER") != null 
            ? System.getenv("DB_USER") 
            : "MZ";

    private static final String DEFAULT_PASS = 
        System.getenv("DB_PASSWORD") != null 
            ? System.getenv("DB_PASSWORD") 
            : "mzcet@1234";

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
            return result > 0;
        } catch (Exception e) {
            System.err.println("Database insertion error in CareerProfileDAO: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
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
