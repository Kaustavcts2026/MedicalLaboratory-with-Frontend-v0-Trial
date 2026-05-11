package com.medlab.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Global CORS configuration for the API Gateway.
 *
 * CorsWebFilter implements WebFilter (not GlobalFilter), so it runs at the
 * WebFlux dispatcher level — BEFORE Spring Cloud Gateway processes routes and
 * before the JwtAuthFilter.  This guarantees that:
 *
 *   1. OPTIONS preflight requests receive the correct Access-Control-* headers
 *      and a 200 response WITHOUT being challenged for a JWT token.
 *
 *   2. Every actual API response also carries the Access-Control-Allow-Origin
 *      header so the browser accepts it.
 *
 * Note: the spring.cloud.gateway.globalcors YAML property was moved to
 * spring.cloud.gateway.server.webflux.globalcors in Spring Cloud 2025.1.x,
 * so configuring CORS via a Java bean is more reliable across versions.
 */
@Configuration
public class CorsConfig {

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // Allow requests from the Angular dev server.
        config.setAllowedOrigins(List.of("http://localhost:4200"));

        // Allow all standard HTTP methods used by the REST API.
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Allow all request headers (Authorization, Content-Type, etc.).
        config.setAllowedHeaders(List.of("*"));

        // Allow the browser to read response headers (e.g. for pagination or custom headers).
        config.setExposedHeaders(List.of("*"));

        // Allow cookies / Authorization headers to be sent with cross-origin requests.
        config.setAllowCredentials(true);

        // Cache the preflight result for 1 hour so the browser doesn't repeat it.
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }
}
