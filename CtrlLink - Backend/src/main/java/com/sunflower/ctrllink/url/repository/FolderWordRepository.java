package com.sunflower.ctrllink.url.repository;

import com.sunflower.ctrllink.url.entity.FolderWordEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface FolderWordRepository extends JpaRepository<FolderWordEntity, Long> {

    Optional<FolderWordEntity> findByWord(String word);

    List<FolderWordEntity> findByWordIn(Collection<String> words);

    boolean existsByWord(String word);
}
