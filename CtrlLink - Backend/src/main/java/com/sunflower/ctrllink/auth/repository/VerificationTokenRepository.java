package com.sunflower.ctrllink.auth.repository;

import com.sunflower.ctrllink.auth.entity.VerificationTokenEntity;
import com.sunflower.ctrllink.user.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VerificationTokenRepository extends JpaRepository<VerificationTokenEntity, Long> {
    Optional<VerificationTokenEntity> findByToken(String token);
    void deleteByUser(UserEntity user);
}
