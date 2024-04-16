# Use the official PostgreSQL image as the base image
FROM postgres:16

# Set environment variables
ENV POSTGRES_DB=${DB_NAME} \
    POSTGRES_USER=${DB_USER} \
    POSTGRES_PASSWORD=${DB_PASSWORD}

# Create a volume for persistent data storage
VOLUME /var/lib/postgresql/data

COPY postgresql.conf /etc/postgresql/16/main/

RUN apt get-update
RUN apt-get install -y procps
# Expose the PostgreSQL port
EXPOSE 5432

# Start PostgreSQL service
# CMD ["postgres"]