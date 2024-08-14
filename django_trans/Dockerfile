# Use an official Python runtime as a parent image
FROM python:3.12

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

# Copy the requirements.txt and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
# RUN pip install django-sslserver

# Generate a self-signed certificate without passphrase
RUN openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
    -subj "/C=CA/ST=Quebec/L=Quebec City/O=42/OU=yes/CN=localhost"

# Copy the rest of the application
COPY . .

# Collect static files
# RUN python manage.py collectstatic --noinput

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define the command to run your app using Gunicorn
# CMD ["gunicorn", "django_trans.wsgi:application","--bind", "0.0.0.0:8000"]

#Collectstatic not collecting updated files after caching fix
# Copy the entrypoint.sh script into the container
COPY entrypoint.sh /app/entrypoint.sh

# Set the entrypoint script as executable
RUN chmod +x /app/entrypoint.sh

# Set the entrypoint script as the entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]