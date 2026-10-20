-- ====================================================================
-- CAREER CONNECT - WEB TECHNOLOGY LAB
-- PORTABLE DATABASE SCHEMA (MySQL, PostgreSQL, SQLite Compatible)
-- ====================================================================

CREATE TABLE IF NOT EXISTS CareerProfiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- SQLite syntax; for Postgres use SERIAL, MySQL use AUTO_INCREMENT
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    education VARCHAR(100) NOT NULL,
    skills VARCHAR(500) NOT NULL,
    careerGoal VARCHAR(100) NOT NULL,
    experience VARCHAR(50) NOT NULL,
    goals VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO CareerProfiles (name, email, phone, education, skills, careerGoal, experience, goals)
VALUES 
('Kalaiyarasan K', 'kalaiyarasan@gmail.com', '9876543210', 'B.E / B.Tech', 'HTML, CSS, JavaScript, Java, SQL', 'Software Developer', 'Fresher', 'Build scalable cloud applications and enterprise career intelligence systems.'),
('Arun Kumar', 'arun@gmail.com', '8765432109', 'B.E / B.Tech', 'Python, SQL, Machine Learning', 'AI / ML Engineer', 'Fresher', 'Work on foundation AI models and machine learning pipelines.');
