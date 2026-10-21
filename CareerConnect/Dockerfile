# ==============================================================================
# Career Connect — Apache Tomcat 9 Docker Container
# Java Servlet 3.1 & Microsoft SQL Server Backend
# ==============================================================================

# Official Apache Tomcat 9 with Eclipse Temurin OpenJDK 17 LTS
FROM tomcat:9.0-jdk17-temurin

# Set working directory inside container
WORKDIR /usr/local/tomcat

# Remove default Tomcat webapps (ROOT, examples, docs, host-manager, manager)
RUN rm -rf /usr/local/tomcat/webapps/*

# Copy pre-packaged CareerConnect.war as ROOT.war so servlets mount directly at "/"
# Endpoints: /AuthServlet, /CareerServlet, /SessionTrackingServlet, /index-5a.html
COPY WebApplication/CareerConnect.war /usr/local/tomcat/webapps/ROOT.war

# Copy startup script for dynamic PORT handling (e.g., Render, Railway)
COPY start-tomcat.sh /usr/local/tomcat/bin/start-tomcat.sh
RUN sed -i 's/\r$//' /usr/local/tomcat/bin/start-tomcat.sh \
    && chmod +x /usr/local/tomcat/bin/start-tomcat.sh

# Set default environment variables
ENV PORT=8080
ENV JAVA_OPTS="-Dfile.encoding=UTF-8 -Xms256m -Xmx512m"

# Expose default HTTP port
EXPOSE 8080

# Start Tomcat via dynamic port adapter script
CMD ["/usr/local/tomcat/bin/start-tomcat.sh"]
