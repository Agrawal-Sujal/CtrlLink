package com.sunflower.ctrllink.url.dto;

import java.util.List;

public class ReorderRequestDto {
    private List<String> shortIds;

    public ReorderRequestDto() {
    }

    public ReorderRequestDto(List<String> shortIds) {
        this.shortIds = shortIds;
    }

    public List<String> getShortIds() {
        return shortIds;
    }

    public void setShortIds(List<String> shortIds) {
        this.shortIds = shortIds;
    }
}
