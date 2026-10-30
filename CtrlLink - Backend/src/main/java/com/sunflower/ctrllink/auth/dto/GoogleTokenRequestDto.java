package com.sunflower.ctrllink.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleTokenRequestDto {
    @NotBlank(message = "ID token is required")
    private String idToken;

    public String getIdToken() { return idToken; }
    public void setIdToken(String idToken) { this.idToken = idToken; }
}
