<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:template match="/">
    <html>
    <head>
        <title>Career Connect</title>
        <style>
            body {
                font-family: Arial;
                background: #e8f5e9;
                text-align: center;
                margin: 0;
                padding: 30px;
            }
            h1 {
                color: #238636;
                margin-bottom: 8px;
            }
            h2 {
                color: #333;
                margin-bottom: 25px;
            }
            table {
                margin: auto;
                border-collapse: collapse;
                width: 95%;
                background: white;
                box-shadow: 0 10px 25px #0002;
            }
            th {
                background: #238636;
                color: white;
                padding: 12px;
            }
            td {
                border: 1px solid #999;
                padding: 10px;
                color: #333;
            }
            tr:nth-child(even) {
                background: #f7f9fc;
            }
        </style>
    </head>
    <body>
        <h1>CAREER CONNECT</h1>
        <h2>Career Profile Details</h2>
        <table>
            <tr>
                <th>Profile ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Education</th>
                <th>Skills</th>
                <th>Career Goal</th>
                <th>Experience</th>
            </tr>
            <xsl:for-each select="careerConnect/profile">
            <tr>
                <td><xsl:value-of select="profileId"/></td>
                <td><xsl:value-of select="name"/></td>
                <td><xsl:value-of select="email"/></td>
                <td><xsl:value-of select="phone"/></td>
                <td><xsl:value-of select="education"/></td>
                <td><xsl:value-of select="skills"/></td>
                <td><xsl:value-of select="careerGoal"/></td>
                <td><xsl:value-of select="experience"/></td>
            </tr>
            </xsl:for-each>
        </table>
    </body>
    </html>
    </xsl:template>
</xsl:stylesheet>
