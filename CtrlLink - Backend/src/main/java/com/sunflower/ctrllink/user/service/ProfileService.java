package com.sunflower.ctrllink.user.service;

import com.sunflower.ctrllink.exception.BadRequestException;
import com.sunflower.ctrllink.exception.ConflictException;
import com.sunflower.ctrllink.user.dto.ProfileResponseDto;
import com.sunflower.ctrllink.user.dto.ProfileUpdateRequestDto;
import com.sunflower.ctrllink.user.entity.UserEntity;
import com.sunflower.ctrllink.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ProfileService {

    private static final Logger log = LoggerFactory.getLogger(ProfileService.class);
    private final UserRepository userRepository;

    public ProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public ProfileResponseDto getProfileById(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        return new ProfileResponseDto(
                user.getName(),
                user.getEmail(),
                user.isEmailVerified(),
                user.getProfilePictureUrl()
        );
    }

    public void updateProfile(Long userId, ProfileUpdateRequestDto request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }

        userRepository.save(user);
        log.info("Profile updated for userId={}", userId);
    }

}
