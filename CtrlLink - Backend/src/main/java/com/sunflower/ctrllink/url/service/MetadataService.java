package com.sunflower.ctrllink.url.service;

import com.sunflower.ctrllink.url.repository.UrlRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class MetadataService {

    private static final Logger log = LoggerFactory.getLogger(MetadataService.class);
    private final UrlRepository urlRepository;

    public MetadataService(UrlRepository urlRepository) {
        this.urlRepository = urlRepository;
    }

    @Async
    public void fetchAndProcessMetadataAsync(String shortId, String longUrl, boolean shouldUpdateTitle) {

    }

    private void fallbackScrape(String shortId, String longUrl, boolean shouldUpdateTitle) {
        try {
            Document doc = Jsoup.connect(longUrl).timeout(5000).get();
            String title = doc.title();
            if (title != null && !title.isBlank()) {
                urlRepository.findByShortId(shortId).ifPresent(entity -> {
                    if (shouldUpdateTitle && (entity.getTitle() == null || entity.getTitle().isBlank())) {
                        entity.setTitle(cleanTitle(title));
                        urlRepository.save(entity);
                    }
                });
            }
        } catch (Exception e) {
            log.warn("Fallback scrape also failed for {}", longUrl);
        }
    }

    public java.util.Map<String, String> fetchMetadata(String longUrl) {
        java.util.Map<String, String> metadata = new java.util.HashMap<>();
        log.debug("Fetching web metadata for longUrl={}", longUrl);
        try {
            Document doc = Jsoup.connect(longUrl)
                    .timeout(5000)
                    .userAgent("Mozilla/5.0")
                    .followRedirects(true)
                    .get();

            metadata.put("title", doc.title());
            Element metaDesc = doc.select("meta[name=description]").first();
            if (metaDesc != null) {
                metadata.put("description", metaDesc.attr("content"));
            } else {
                metadata.put("description", "");
            }
            log.debug("Fetched metadata for {}: title='{}'", longUrl, metadata.get("title"));
        } catch (Exception e) {
            log.warn("Could not fetch metadata for {}: {}", longUrl, e.getMessage());
            metadata.put("title", "");
            metadata.put("description", "");
        }
        return metadata;
    }

    private String cleanTitle(String title) {
        if (title == null || title.isBlank()) return null;

        // Take only the first part before common separators like · - |
        String cleaned = title.split(" [·\\-|] ")[0].trim();

        // Limit to 70 characters for UI consistency
        if (cleaned.length() > 70) {
            cleaned = cleaned.substring(0, 67) + "...";
        }

        return cleaned;
    }
}
