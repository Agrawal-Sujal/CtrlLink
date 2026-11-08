package com.sunflower.ctrllink.url.service;

import com.sunflower.ctrllink.url.repository.IdRangeAllocator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.concurrent.locks.ReentrantLock;

@Service
public class IdRangeService {

    private static final Logger log = LoggerFactory.getLogger(IdRangeService.class);
    private static final String ALLOCATOR_NAME = "url_short_id";

    private final IdRangeAllocator idRangeAllocator;
    private final int batchSize;

    private long currentId = 0;
    private long maxId = -1;
    private final ReentrantLock lock = new ReentrantLock();

    public IdRangeService(IdRangeAllocator idRangeAllocator,
                          @Value("${app.url.id-batch-size:100}") int batchSize) {
        this.idRangeAllocator = idRangeAllocator;
        this.batchSize = batchSize;
    }

    /**
     * Dispenses the next unique ID from the in-memory buffer.
     * When the buffer is exhausted, it calls the database to allocate the next batch of IDs.
     */
    public long getNextId() {
        lock.lock();
        try {
            if (currentId > maxId) {
                log.info("In-memory ID buffer exhausted (currentId={}, maxId={}). Fetching batch size={} from DB",
                        currentId, maxId, batchSize);
                long start = System.currentTimeMillis();
                long startId = idRangeAllocator.allocateRange(ALLOCATOR_NAME, batchSize);
                currentId = startId;
                maxId = startId + batchSize - 1;
                log.info("Allocated new in-memory ID batch: [{}, {}] in {}ms",
                        currentId, maxId, (System.currentTimeMillis() - start));
            }
            long dispensed = currentId++;
            log.trace("Dispensed next unique ID={} (remainingInBuffer={})", dispensed, (maxId - currentId + 1));
            return dispensed;
        } finally {
            lock.unlock();
        }
    }

    public int getBatchSize() {
        return batchSize;
    }

    public long getCurrentId() {
        lock.lock();
        try {
            return currentId;
        } finally {
            lock.unlock();
        }
    }

    public long getMaxId() {
        lock.lock();
        try {
            return maxId;
        } finally {
            lock.unlock();
        }
    }
}
