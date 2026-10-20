import java.awt.*;
import java.awt.geom.*;
import java.awt.image.BufferedImage;
import java.io.File;
import javax.imageio.ImageIO;

public class GenerateCareerConnectImage {
    public static void main(String[] args) throws Exception {
        int width = 950;
        int height = 650;
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();

        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        // Background Gradient: Deep slate / modern tech
        GradientPaint bg = new GradientPaint(0, 0, new Color(15, 23, 42), width, height, new Color(30, 41, 59));
        g.setPaint(bg);
        g.fillRoundRect(0, 0, width, height, 32, 32);

        // Subtle background grid or glow
        g.setColor(new Color(34, 197, 94, 20));
        g.fillOval(width / 2 - 250, height / 2 - 200, 500, 400);

        // Header Title
        g.setColor(new Color(34, 197, 94));
        g.setFont(new Font("SansSerif", Font.BOLD, 28));
        String title = "CAREER CONNECT";
        FontMetrics fm = g.getFontMetrics();
        g.drawString(title, (width - fm.stringWidth(title)) / 2, 55);

        g.setColor(new Color(148, 163, 184));
        g.setFont(new Font("SansSerif", Font.PLAIN, 14));
        String subtitle = "AI Career Intelligence Platform • Interactive Map Hotspots";
        fm = g.getFontMetrics();
        g.drawString(subtitle, (width - fm.stringWidth(subtitle)) / 2, 85);

        // Center connecting node
        int cx = width / 2;
        int cy = height / 2 + 10;
        g.setColor(new Color(34, 197, 94, 40));
        g.fillOval(cx - 70, cy - 70, 140, 140);
        g.setColor(new Color(34, 197, 94));
        g.setStroke(new BasicStroke(2.5f));
        g.drawOval(cx - 55, cy - 55, 110, 110);
        g.setColor(Color.WHITE);
        g.setFont(new Font("SansSerif", Font.BOLD, 22));
        fm = g.getFontMetrics();
        g.drawString("CC AI", cx - fm.stringWidth("CC AI") / 2, cy + 8);

        // Connect lines from center to quadrants
        g.setColor(new Color(51, 65, 85));
        g.setStroke(new BasicStroke(2.0f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND, 10.0f, new float[]{6.0f, 6.0f}, 0.0f));
        g.drawLine(cx, cy, 180, 210);
        g.drawLine(cx, cy, 720, 210);
        g.drawLine(cx, cy, 180, 420);
        g.drawLine(cx, cy, 720, 420);

        // Draw the 4 Hotspot Quadrant Cards matching the exact coordinates
        // 1. Profile: coords="60,120,300,300" -> x=60, y=120, w=240, h=180
        drawCard(g, 60, 120, 240, 180, "01. PROFILE", "Education & Experience", "Personal Skills & Goals", new Color(16, 185, 129));

        // 2. Jobs: coords="600,120,840,300" -> x=600, y=120, w=240, h=180
        drawCard(g, 600, 120, 240, 180, "02. JOBS", "Job Discovery & Roles", "Company Intelligence", new Color(59, 130, 246));

        // 3. Skills: coords="60,330,300,510" -> x=60, y=330, w=240, h=180
        drawCard(g, 60, 330, 240, 180, "03. SKILLS", "Skill Gap Engine", "Emerging Tech Stack", new Color(245, 158, 11));

        // 4. Analytics: coords="600,330,840,510" -> x=600, y=330, w=240, h=180
        drawCard(g, 600, 330, 240, 180, "04. ANALYTICS", "Salary Trends & BI", "Placement Market Insights", new Color(168, 85, 247));

        // Bottom instruction bar
        g.setColor(new Color(15, 23, 42, 200));
        g.fillRoundRect(200, 580, 550, 45, 20, 20);
        g.setColor(new Color(34, 197, 94));
        g.drawRoundRect(200, 580, 550, 45, 20, 20);
        g.setColor(Color.WHITE);
        g.setFont(new Font("SansSerif", Font.PLAIN, 13));
        String tip = "Click any hotspot box above to jump to that section";
        fm = g.getFontMetrics();
        g.drawString(tip, (width - fm.stringWidth(tip)) / 2, 607);

        g.dispose();

        File outPublic = new File("public/career-connect.png");
        outPublic.getParentFile().mkdirs();
        ImageIO.write(img, "png", outPublic);
        System.out.println("Generated: " + outPublic.getAbsolutePath());

        // Also copy to root and wt-lab for standalone viewing
        File outRoot = new File("career-connect.png");
        ImageIO.write(img, "png", outRoot);

        File outWt = new File("wt-lab/java-web/web/career-connect.png");
        outWt.getParentFile().mkdirs();
        ImageIO.write(img, "png", outWt);
    }

    private static void drawCard(Graphics2D g, int x, int y, int w, int h, String title, String line1, String line2, Color accent) {
        // Card Body
        g.setColor(new Color(30, 41, 59, 240));
        g.fillRoundRect(x, y, w, h, 16, 16);

        // Glow Border
        g.setColor(accent);
        g.setStroke(new BasicStroke(2.0f));
        g.drawRoundRect(x, y, w, h, 16, 16);

        // Header Pill
        g.setColor(new Color(accent.getRed(), accent.getGreen(), accent.getBlue(), 40));
        g.fillRoundRect(x + 15, y + 15, w - 30, 36, 10, 10);
        g.setColor(accent);
        g.setFont(new Font("SansSerif", Font.BOLD, 15));
        FontMetrics fm = g.getFontMetrics();
        g.drawString(title, x + (w - fm.stringWidth(title)) / 2, y + 38);

        // Line 1
        g.setColor(Color.WHITE);
        g.setFont(new Font("SansSerif", Font.BOLD, 13));
        fm = g.getFontMetrics();
        g.drawString(line1, x + (w - fm.stringWidth(line1)) / 2, y + 90);

        // Line 2
        g.setColor(new Color(148, 163, 184));
        g.setFont(new Font("SansSerif", Font.PLAIN, 12));
        fm = g.getFontMetrics();
        g.drawString(line2, x + (w - fm.stringWidth(line2)) / 2, y + 120);

        // Click indicator
        g.setColor(accent);
        g.setFont(new Font("SansSerif", Font.BOLD, 11));
        String click = "[ CLICK HOTSPOT ]";
        fm = g.getFontMetrics();
        g.drawString(click, x + (w - fm.stringWidth(click)) / 2, y + 155);
    }
}
