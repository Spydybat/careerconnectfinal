-- ====================================================================
-- CAREER CONNECT - WEB TECHNOLOGY LAB
-- DATABASE SCHEMA & SCRIPTS: EXERCISE 6(A) & 6(B)
-- Author: Kalaiyarasan K (9943)
-- Target DBMS: Microsoft SQL Server (and ANSI-SQL compatible DBMS)
-- ====================================================================

-- 1. Create and switch to target database
-- Default database specified in lab manual: CSE9943 / CSE9596
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'CSE9943')
BEGIN
    CREATE DATABASE CSE9943;
END
GO

USE CSE9943;
GO

-- 2. Create CareerProfiles table
-- Schema definition matching Exercise 6(A) and 6(B) specifications
IF OBJECT_ID('dbo.CareerProfiles', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.CareerProfiles;
END
GO

CREATE TABLE CareerProfiles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    education VARCHAR(100) NOT NULL,
    skills VARCHAR(500) NOT NULL,
    careerGoal VARCHAR(100) NOT NULL,
    experience VARCHAR(50) NOT NULL,
    goals VARCHAR(500) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- 3. Verification & Seed Data
INSERT INTO CareerProfiles (name, email, phone, education, skills, careerGoal, experience, goals)
VALUES 
('Kalaiyarasan K', 'kalaiyarasan@gmail.com', '9876543210', 'B.E / B.Tech', 'HTML, CSS, JavaScript, Java, SQL', 'Software Developer', 'Fresher', 'Build scalable cloud applications and enterprise career intelligence systems.'),
('Arun Kumar', 'arun@gmail.com', '8765432109', 'B.E / B.Tech', 'Python, SQL, Machine Learning', 'AI / ML Engineer', 'Fresher', 'Work on foundation AI models and machine learning pipelines.'),
('Priya Raman', 'priya@gmail.com', '7654321098', 'B.Sc', 'Excel, SQL, Power BI, Statistics', 'Data Analyst', '0 - 2 Years', 'Lead enterprise data visualization and BI initiatives.'),
('Vijay S', 'vijay@gmail.com', '9543216780', 'B.E / B.Tech', 'Java, Spring Boot, Microservices, SQL', 'Software Developer', '0 - 2 Years', 'Architect high-throughput distributed backend services.');
GO

-- 4. Query all records
SELECT 
    id,
    name,
    email,
    phone,
    education,
    skills,
    careerGoal,
    experience,
    goals,
    created_at
FROM CareerProfiles
ORDER BY id ASC;
GO
