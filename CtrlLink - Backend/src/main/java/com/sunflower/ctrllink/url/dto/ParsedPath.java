package com.sunflower.ctrllink.url.dto;

import java.util.List;

public record ParsedPath(
        List<String> folderSegments,
        String terminalAlias,
        boolean requiresAutoSlug,
        String originalCleanPath
) {
    public boolean isRoot() {
        return folderSegments == null || folderSegments.isEmpty();
    }
}
