package com.sunflower.ctrllink.user.controller;

import com.sunflower.ctrllink.url.service.UrlService;
import com.sunflower.ctrllink.user.dto.ProfileResponseDto;
import com.sunflower.ctrllink.user.dto.ProfileUpdateRequestDto;
import com.sunflower.ctrllink.user.entity.UserEntity;
import com.sunflower.ctrllink.user.repository.UserRepository;
import com.sunflower.ctrllink.user.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/profile")
@Tag(name = "User Profile", description = "Endpoints for managing user display names, bios, and theme colors")
public class ProfileController {

    private final ProfileService profileService;
    private final UrlService dbUrlService;
    private final UserRepository userRepository;

    public ProfileController(ProfileService profileService, UrlService dbUrlService, UserRepository userRepository) {
        this.profileService = profileService;
        this.dbUrlService = dbUrlService;
        this.userRepository = userRepository;
    }

    // Private Endpoint - Load current user's profile for settings
    @Operation(summary = "Get your own profile", description = "Returns full profile details for the authenticated user.")
    @GetMapping("/me")
    public ResponseEntity<ProfileResponseDto> getMyProfile(@AuthenticationPrincipal Object principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }

        Long userId = null;
        if (principal instanceof Long) {
            userId = (Long) principal;
        } else if (principal instanceof Integer) {
            userId = ((Integer) principal).longValue();
        }

        ProfileResponseDto profile = profileService.getProfileById(userId);
        return ResponseEntity.ok(profile);
    }

    // Authenticated Endpoint - Secure User Updates
    @Operation(summary = "Update profile settings", description = "Updates display name, bio, and theme preferences for the authenticated user.")
    @PostMapping("/settings")
    public ResponseEntity<Map<String, String>> updateProfileSettings(
            @RequestBody ProfileUpdateRequestDto request,
            @AuthenticationPrincipal Object principal) {
                
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        Long userId = null;
        if (principal instanceof Long) {
            userId = (Long) principal;
        } else if (principal instanceof Integer) {
            userId = ((Integer) principal).longValue();
        } else {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid principal type"));
        }

        profileService.updateProfile(userId, request);
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }

    @Operation(summary = "Upload profile picture", description = "Uploads a profile picture to Cloudinary and saves the secure URL.")
    @PostMapping(value = "/picture", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadProfilePicture(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Object principal) {

        if (principal == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

        Long userId = null;
        if (principal instanceof Long) {
            userId = (Long) principal;
        } else if (principal instanceof Integer) {
            userId = ((Integer) principal).longValue();
        } else {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid session"));
        }

        try {
//            String secureUrl = cloudinaryService.uploadProfilePicture(file);
            String secureUrl = "cloudinaryService.uploadProfilePicture(file);";
            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            user.setProfilePictureUrl(secureUrl);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("profilePictureUrl", secureUrl));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
//        catch (IOException e) {
//            return ResponseEntity.internalServerError().body(Map.of("message", "Upload failed. Please try again."));
//        }
    }
}
