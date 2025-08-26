# 1단계: 빌드(Build) 환경
# JDK 17 버전을 사용하여 프로젝트를 빌드합니다.
FROM eclipse-temurin:17-jdk-jammy as builder
WORKDIR /app
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline # 의존성을 먼저 받아 빌드 캐시를 활용합니다.
COPY src ./src
RUN ./mvnw package -DskipTests # 테스트를 건너뛰고 JAR 파일을 만듭니다.

# 2단계: 최종 실행(Final) 환경
# 훨씬 가벼운 JRE 버전 이미지를 사용합니다.
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# 1단계에서 만들어진 JAR 파일만 복사해옵니다.
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
# 컨테이너가 시작될 때 이 명령어로 애플리케이션을 실행합니다.
ENTRYPOINT ["java", "-jar", "app.jar"]