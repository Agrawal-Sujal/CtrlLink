package com.sunflower.ctrllink.url.dto;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

public class UrlStatsResponseDto {

    private String shortId;
    private String customPath;
    private String folderPathKey;
    private String longUrl;
    private long clickCount;
    private LocalDateTime lastAccessedTime;
    private LocalDateTime createdAt;
    private String title;
    private boolean passwordProtected;
    private String password;
    private Map<String, Long> timeSeries;
    private Map<String, Long> countries;
    private Map<String, Long> referrers;
    private Map<String, Long> devices;
    private Integer orderIndex;
    private String category;
    private Set<String> tags;

    public UrlStatsResponseDto(String shortId, String longUrl, long clickCount, LocalDateTime lastAccessedTime,
                               LocalDateTime createdAt, String title, boolean passwordProtected, String password,
                               Map<String, Long> timeSeries, Map<String, Long> countries, Map<String, Long> referrers,
                               Map<String, Long> devices, Integer orderIndex, String category, Set<String> tags) {
        this(shortId, shortId, "", longUrl, clickCount, lastAccessedTime, createdAt, title,
                passwordProtected, password, timeSeries, countries, referrers, devices, orderIndex, category, tags);
    }

    public UrlStatsResponseDto(String shortId, String customPath, String folderPathKey, String longUrl, long clickCount,
                               LocalDateTime lastAccessedTime, LocalDateTime createdAt, String title,
                               boolean passwordProtected, String password, Map<String, Long> timeSeries,
                               Map<String, Long> countries, Map<String, Long> referrers, Map<String, Long> devices,
                               Integer orderIndex, String category, Set<String> tags) {
        this.shortId = shortId;
        this.customPath = customPath != null ? customPath : shortId;
        this.folderPathKey = folderPathKey != null ? folderPathKey : "";
        this.longUrl = longUrl;
        this.clickCount = clickCount;
        this.lastAccessedTime = lastAccessedTime;
        this.createdAt = createdAt;
        this.title = title;
        this.passwordProtected = passwordProtected;
        this.password = password;
        this.timeSeries = timeSeries;
        this.countries = countries;
        this.referrers = referrers;
        this.devices = devices;
        this.orderIndex = orderIndex;
        this.category = category;
        this.tags = tags;
    }

    public String getTitle() {
        return title;
    }

    public String getShortId() {
        return shortId;
    }

    public String getCustomPath() {
        return customPath;
    }

    public String getFolderPathKey() {
        return folderPathKey;
    }

    public String getLongUrl() {
        return longUrl;
    }

    public long getClickCount() {
        return clickCount;
    }

    public LocalDateTime getLastAccessedTime() {
        return lastAccessedTime;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public boolean isPasswordProtected() {
        return passwordProtected;
    }

    public String getPassword() {
        return password;
    }

    public Map<String, Long> getTimeSeries() {
        return timeSeries;
    }

    public Map<String, Long> getCountries() {
        return countries;
    }

    public Map<String, Long> getReferrers() {
        return referrers;
    }

    public Map<String, Long> getDevices() {
        return devices;
    }

    public Integer getOrderIndex() {
        return orderIndex;
    }

    public String getCategory() {
        return category;
    }

    public Set<String> getTags() {
        return tags;
    }
}
