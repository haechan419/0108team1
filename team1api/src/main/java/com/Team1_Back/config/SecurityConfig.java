package com.Team1_Back.config;

import java.util.List;

import com.Team1_Back.security.filter.JWTCheckFilter;
import com.Team1_Back.security.handler.APILoginFailHandler;
import com.Team1_Back.security.handler.APILoginSuccessHandler;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import static org.springframework.core.Ordered.HIGHEST_PRECEDENCE;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private final ApplicationEventPublisher eventPublisher;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public JWTCheckFilter jwtCheckFilter() {
        return new JWTCheckFilter();
    }

    @Bean
    @Order(HIGHEST_PRECEDENCE)
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of(
                "Content-Type",
                "Authorization",
                "Cache-Control",
                "X-User-Id",
                "X-Role",
                "X-Dept"));
        config.setExposedHeaders(List.of("Content-Disposition"));

        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        log.info("--------------------- security config (JWT + API no-redirect) ---------------------");

        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // ✅ JWT 기반이면 stateless
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .addFilterBefore(new JWTCheckFilter(), UsernamePasswordAuthenticationFilter.class)

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()

                        // ✅ 관리자 전용
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // ✅ 로그인 필요
                        .requestMatchers("/api/reports/**").authenticated()

                        .anyRequest().permitAll())

                // ✅ API는 리다이렉트 금지: 무조건 401 JSON
                .exceptionHandling(e -> e
                        .defaultAuthenticationEntryPointFor(
                                (request, response, authException) -> {
                                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                    response.setContentType("application/json; charset=UTF-8");
                                    response.getWriter().write("{\"success\":false,\"message\":\"UNAUTHORIZED\"}");
                                },
                                new AntPathRequestMatcher("/api/**")))

                // ✅ 로그인은 처리 URL만 사용 (페이지 렌더링 X)
                .formLogin(form -> form
                        .loginProcessingUrl("/api/auth/login")
                        .usernameParameter("employeeNo")
                        .passwordParameter("password")
                        .successHandler(new APILoginSuccessHandler(eventPublisher))
                        .failureHandler(new APILoginFailHandler(eventPublisher)))

                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setStatus(200);
                            response.setContentType("application/json; charset=UTF-8");
                            response.getWriter().write("{\"success\":true,\"message\":\"로그아웃 성공\"}");
                        }))

                .httpBasic(basic -> basic.disable());

        // ✅ JWT 필터 등록
        http.addFilterBefore(jwtCheckFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
