# Use the base SQL Server image
FROM rapidfort/microsoft-sql-server-2019-ib

# Specify environment variables for SQL Server
ENV ACCEPT_EULA=Y
ENV MSSQL_SA_PASSWORD=Str0ngP@ss

USER root

# Create a directory to copy your SQL scripts
RUN mkdir -p /usr/config
WORKDIR /usr/config

# Bundle config source
COPY . /usr/config

# Grant permissions for to our scripts to be executable
RUN chmod +x /usr/config/entrypoint.sh
RUN chmod +x /usr/config/configure-db.sh

USER mssql
ENTRYPOINT ["./entrypoint.sh"]