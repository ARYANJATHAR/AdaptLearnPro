// Smart fallback strategy for when primary AI service fails
const usageTracker = require('./usage-tracker');

class FallbackStrategy {
    constructor() {
        this.strategies = [
            'cache',           // Try cache first
            'reduced_batch',   // Try smaller batch size
            'fallback_questions' // Use pre-defined questions
        ];
    }

    // Determine the best fallback strategy based on error type
    getStrategy(error, topic, difficulty, count) {
        console.log('[FALLBACK] Determining strategy for error:', error.message);

        // If quota exceeded, use cache or fallback questions
        if (error.status === 429 || error.message.includes('QUOTA_EXCEEDED')) {
            return {
                strategy: 'quota_exceeded',
                action: 'use_fallback',
                reason: 'API quota exceeded'
            };
        }

        // If rate limited, suggest retry with delay
        if (error.message.includes('rate limit')) {
            return {
                strategy: 'rate_limited',
                action: 'retry_with_delay',
                delay: 5000, // 5 seconds
                reason: 'Rate limit hit'
            };
        }

        // If API key issues, use fallback
        if (error.message.includes('API_KEY') || error.message.includes('PERMISSION_DENIED')) {
            return {
                strategy: 'auth_error',
                action: 'use_fallback',
                reason: 'Authentication error'
            };
        }

        // For other errors, try reduced batch size first
        if (count > 5) {
            return {
                strategy: 'reduce_batch',
                action: 'retry_smaller',
                newCount: Math.max(5, Math.floor(count / 2)),
                reason: 'Reduce batch size'
            };
        }

        // Default to fallback questions
        return {
            strategy: 'default_fallback',
            action: 'use_fallback',
            reason: 'Unknown error'
        };
    }

    // Check if we should use fallback based on current usage
    shouldUseFallback() {
        const usage = usageTracker.getCurrentUsage();
        
        // If approaching daily limit, start using fallback
        if (usage.requests > 800) { // 80% of 1000 request limit
            console.log('[FALLBACK] Approaching daily limit, using fallback');
            return true;
        }

        return false;
    }

    // Get appropriate message for user based on strategy
    getUserMessage(strategy) {
        const messages = {
            quota_exceeded: 'Using cached questions due to high demand. Your quiz experience remains great!',
            rate_limited: 'Generating questions... This may take a moment.',
            auth_error: 'Using backup question system. Full functionality will return shortly.',
            reduce_batch: 'Optimizing question generation...',
            default_fallback: 'Using our curated question library for the best experience.'
        };

        return messages[strategy.strategy] || messages.default_fallback;
    }
}

module.exports = new FallbackStrategy();