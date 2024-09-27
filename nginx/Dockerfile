# Use the official Nginx image as the base
FROM nginx:alpine

# Remove the default Nginx configuration file
# RUN rm /etc/nginx/conf.d/default.conf

# Copy the configuration file from the current directory to the container
COPY nginx.conf /etc/nginx/nginx.conf

# Copy SSL certificates
COPY certs/cert.pem /etc/nginx/certs/
COPY certs/key.pem /etc/nginx/certs/

RUN apt-get update && apt-get install -y ca-certificates

# Copy your self-signed certificate into the container
COPY self-signed.crt /usr/local/share/ca-certificates/self-signed.crt

# Update the CA store
RUN update-ca-certificates

# Expose ports 80 and 443 for HTTP and HTTPS
EXPOSE 443

# Start Nginx when the container has provisioned
CMD ["nginx", "-g", "daemon off;"]
