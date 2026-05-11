package com.medlab.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

/**
 * Disables Spring Security's default reactive auto-configuration in the gateway.
 *
 * spring-cloud-starter-gateway-server-webflux transitively includes spring-security-web,
 * which causes Spring Boot to auto-configure a ReactiveSecurityWebFilterChain that
 * requires HTTP Basic authentication for every request. Without this config bean,
 * any POST/PUT/DELETE from Angular would get 401 (Bearer tokens ≠ Basic auth)
 * and the default CSRF filter would add a second layer of 403 for state-changing
 * requests.
 *
 * JWT validation is handled exclusively by JwtAuthFilter (GlobalFilter, order -1).
 * Spring Security is kept on the classpath but configured to be fully transparent.
 */
@Configuration
@EnableWebFluxSecurity
public class GatewaySecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(csrf -> csrf.disable())
                .httpBasic(httpBasic -> httpBasic.disable())
                .formLogin(formLogin -> formLogin.disable())
                .authorizeExchange(exchanges -> exchanges
                        .anyExchange().permitAll()
                )
                .build();
    }
}
