FROM eclipse-temurin:21-jdk

WORKDIR /app

# Copy full project
COPY . .

# Build jar inside Docker
RUN ./mvnw clean package -DskipTests

# Run jar
ENTRYPOINT ["java","-jar","target/ecobazzar-0.0.1-SNAPSHOT.jar"]
