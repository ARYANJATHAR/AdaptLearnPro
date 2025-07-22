// Simple in-memory cache for quiz questions
class QuestionCache {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 100; // Maximum number of cached topics
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    }

    // Generate cache key
    getCacheKey(topic, difficulty, count) {
        return `${topic.toLowerCase()}-${difficulty}-${count}`;
    }

    // Get questions from cache
    get(topic, difficulty, count) {
        const key = this.getCacheKey(topic, difficulty, count);
        const cached = this.cache.get(key);
        
        if (!cached) {
            return null;
        }
        
        // Check if cache has expired
        if (Date.now() - cached.timestamp > this.cacheExpiry) {
            this.cache.delete(key);
            return null;
        }
        
        console.log(`[CACHE] Cache hit for: ${key}`);
        return cached.questions;
    }

    // Store questions in cache
    set(topic, difficulty, count, questions) {
        const key = this.getCacheKey(topic, difficulty, count);
        
        // If cache is full, remove oldest entry
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            questions: questions,
            timestamp: Date.now()
        });
        
        console.log(`[CACHE] Cached questions for: ${key}`);
    }

    // Clear expired entries
    cleanup() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheExpiry) {
                this.cache.delete(key);
            }
        }
    }

    // Get cache statistics
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Export singleton instance
const questionCache = new QuestionCache();

// Cleanup expired entries every hour
setInterval(() => {
    questionCache.cleanup();
}, 60 * 60 * 1000);

module.exports = questionCache;