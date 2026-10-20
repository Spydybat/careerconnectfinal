import java.io.Serializable;

/**
 * Exercise 6(B) - Three Tier Application Using JSP and Database
 * Model: CareerProfile JavaBean
 * Author: Kalaiyarasan K (9943)
 */
public class CareerProfile implements Serializable {
    private static final long serialVersionUID = 1L;

    private int id;
    private String name;
    private String email;
    private String phone;
    private String education;
    private String skills;
    private String careerGoal;
    private String experience;
    private String goals;

    public CareerProfile() {
    }

    public CareerProfile(String name, String email, String phone, String education, 
                         String skills, String careerGoal, String experience, String goals) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.education = education;
        this.skills = skills;
        this.careerGoal = careerGoal;
        this.experience = experience;
        this.goals = goals;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEducation() { return education; }
    public void setEducation(String education) { this.education = education; }

    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public String getCareerGoal() { return careerGoal; }
    public void setCareerGoal(String careerGoal) { this.careerGoal = careerGoal; }

    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }

    public String getGoals() { return goals; }
    public void setGoals(String goals) { this.goals = goals; }
}
