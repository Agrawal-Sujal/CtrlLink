package com.sunflower.ctrllink.url.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "folder_words", indexes = {
        @Index(name = "idx_folder_words_word", columnList = "word")
})
public class FolderWordEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String word;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public FolderWordEntity() {
    }

    public FolderWordEntity(String word) {
        this.word = word;
    }

    public Long getId() {
        return id;
    }

    public String getWord() {
        return word;
    }

    public void setWord(String word) {
        this.word = word;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
