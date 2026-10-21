#!/bin/bash
set -e

# Default to 8080 if PORT is not set by cloud container host (Render, Railway, etc.)
TARGET_PORT=${PORT:-8080}

echo "Configuring Apache Tomcat HTTP connector to port $TARGET_PORT..."
sed -i "s/port=\"8080\"/port=\"$TARGET_PORT\"/g" /usr/local/tomcat/conf/server.xml

echo "Starting Apache Tomcat on port $TARGET_PORT..."
exec catalina.sh run