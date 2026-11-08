FROM nginx:1.27-alpine

# Copy custom Nginx configuration for reverse-proxying frontend and backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
