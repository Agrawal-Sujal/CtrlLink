package com.sunflower.ctrllink.user.dto;

import com.sunflower.ctrllink.url.dto.UrlStatsResponseDto;

import java.util.List;

public class ProfileResponseDto {
    private String name;
    private String email;
    private boolean emailVerified;
    private String profilePictureUrl;

    public ProfileResponseDto(String name, String email, boolean emailVerified,
                               String profilePictureUrl) {
        this.name = name;
        this.email = email;
        this.emailVerified = emailVerified;
        this.profilePictureUrl = profilePictureUrl;
    }

    public String getName() { return name; }
    public String getEmail() { return email; }
    public boolean isEmailVerified() { return emailVerified; }
    public String getProfilePictureUrl() { return profilePictureUrl; }
}
