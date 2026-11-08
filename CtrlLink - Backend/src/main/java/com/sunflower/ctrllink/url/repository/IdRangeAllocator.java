package com.sunflower.ctrllink.url.repository;

@FunctionalInterface
public interface IdRangeAllocator {

    /**
     * Atomically reserves a block of IDs in the database and returns the starting ID.
     *
     * @param allocatorName name of the counter sequence (e.g., 'url_short_id')
     * @param batchSize     number of IDs to reserve
     * @return starting ID of the reserved range [startId, startId + batchSize - 1]
     */
    long allocateRange(String allocatorName, int batchSize);
}
