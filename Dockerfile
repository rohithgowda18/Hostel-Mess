# Multi-stage Dockerfile for Hostel Dining Platform Backend
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app

# Copy pom.xml and source code
COPY backend/pom.xml ./
COPY backend/src ./src

# Package the Spring Boot application
RUN mvn clean package -DskipTests

# Stage 2: Runtime environment
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy built JAR artifact
COPY --from=builder /app/target/mess-breakfast-1.0.0.jar app.jar

# Expose server port
EXPOSE 8080

# Run Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
