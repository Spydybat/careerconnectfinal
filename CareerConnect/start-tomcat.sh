#!/bin/bash
set -e

# Default to 8080 if PORT is not set by cloud container host (Render, Railway, etc.)
TARGET_PORT=${PORT:-8080}

echo "Configuring Apache Tomcat HTTP connector to port $TARGET_PORT..."
sed -i "s/port=\"8080\"/port=\"$TARGET_PORT\"/g" /usr/local/tomcat/conf/server.xml

# Ensure Tomcat's global context uses SameSite=None for cross-site cookie support
if ! grep -q "sameSiteCookies" /usr/local/tomcat/conf/context.xml; then
    sed -i 's/<Context>/<Context>\n    <CookieProcessor className="org.apache.catalina.core.Rfc6265CookieProcessor" sameSiteCookies="none" \/>/g' /usr/local/tomcat/conf/context.xml
fi

echo "Starting Apache Tomcat on port $TARGET_PORT..."
exec catalina.sh run