package com.sunflower.ctrllink.user.repository;

import com.sunflower.ctrllink.user.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long>{
    Optional<UserEntity> findByEmail(String email);
    boolean existsByEmail(String email);
}