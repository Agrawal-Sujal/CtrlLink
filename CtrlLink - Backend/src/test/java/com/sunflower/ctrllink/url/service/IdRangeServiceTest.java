package com.sunflower.ctrllink.url.service;

import com.sunflower.ctrllink.url.repository.IdRangeAllocator;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;

class IdRangeServiceTest {

    @Test
    void shouldFetchBatchOnFirstCallAndDispenseSequentiallyFromMemory() {
        AtomicInteger dbCallCount = new AtomicInteger(0);
        IdRangeAllocator fakeAllocator = (name, batchSize) -> {
            dbCallCount.incrementAndGet();
            return 100L;
        };

        IdRangeService idRangeService = new IdRangeService(fakeAllocator, 5);

        // 1st call -> fetches batch [100..104]
        long id1 = idRangeService.getNextId();
        assertEquals(100L, id1);
        assertEquals(1, dbCallCount.get());

        // 2nd - 5th calls -> served from memory without calling database
        long id2 = idRangeService.getNextId();
        long id3 = idRangeService.getNextId();
        long id4 = idRangeService.getNextId();
        long id5 = idRangeService.getNextId();

        assertEquals(101L, id2);
        assertEquals(102L, id3);
        assertEquals(103L, id4);
        assertEquals(104L, id5);

        // Database allocator was only called ONCE for the whole batch
        assertEquals(1, dbCallCount.get());
    }

    @Test
    void shouldFetchNewBatchWhenBufferIsExhausted() {
        AtomicInteger dbCallCount = new AtomicInteger(0);
        AtomicLong nextBatchStart = new AtomicLong(100L);

        IdRangeAllocator fakeAllocator = (name, batchSize) -> {
            dbCallCount.incrementAndGet();
            return nextBatchStart.getAndAdd(100L);
        };

        IdRangeService idRangeService = new IdRangeService(fakeAllocator, 5);

        // Consume 5 items (first batch: [100..104])
        for (int i = 0; i < 5; i++) {
            idRangeService.getNextId();
        }
        assertEquals(1, dbCallCount.get());

        // 6th item should exhaust the buffer and trigger second database fetch (second batch: [200..204])
        long id6 = idRangeService.getNextId();
        assertEquals(200L, id6);
        assertEquals(2, dbCallCount.get());
    }

    @Test
    void shouldDispenseUniqueIdsConcurrently() throws InterruptedException {
        int batchSize = 10;
        int numThreads = 10;
        int requestsPerThread = 20; // 200 total IDs requested
        int totalRequests = numThreads * requestsPerThread;

        AtomicLong counter = new AtomicLong(1000L);
        AtomicInteger dbCalls = new AtomicInteger(0);

        IdRangeAllocator fakeAllocator = (name, size) -> {
            dbCalls.incrementAndGet();
            return counter.getAndAdd(size);
        };

        IdRangeService concurrentService = new IdRangeService(fakeAllocator, batchSize);

        ExecutorService executor = Executors.newFixedThreadPool(numThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numThreads);

        Set<Long> generatedIds = ConcurrentHashMap.newKeySet();

        for (int i = 0; i < numThreads; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    for (int j = 0; j < requestsPerThread; j++) {
                        generatedIds.add(concurrentService.getNextId());
                    }
                } catch (Exception e) {
                    fail("Thread execution failed", e);
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        doneLatch.await();
        executor.shutdown();

        // All 200 IDs must be strictly unique
        assertEquals(totalRequests, generatedIds.size());
        // Exactly 200 / 10 = 20 database batch requests should have been made
        assertEquals(totalRequests / batchSize, dbCalls.get());
    }
}
