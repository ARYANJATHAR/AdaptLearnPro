// Simple usage tracking for Gemini API
class UsageTracker {
    constructor() {
        this.dailyUsage = {
            date: new Date().toDateString(),
            requests: 0,
            tokens: 0
        };
    }

    // Track API request
    trackRequest(inputTokens = 0, outputTokens = 0) {
        const today = new Date().toDateString();
        
        // Reset counter if it's a new day
        if (this.dailyUsage.date !== today) {
            this.dailyUsage = {
                date: today,
                requests: 0,
                tokens: 0
            };
        }
        
        this.dailyUsage.requests++;
        this.dailyUsage.tokens += inputTokens + outputTokens;
        
        console.log(`[USAGE] Daily usage: ${this.dailyUsage.requests} requests, ${this.dailyUsage.tokens} tokens`);
    }

    // Get current usage
    getCurrentUsage() {
        const today = new Date().toDateString();
        
        // Reset if new day
        if (this.dailyUsage.date !== today) {
            this.dailyUsage = {
                date: today,
                requests: 0,
                tokens: 0
            };
        }
        
        return this.dailyUsage;
    }

    // Check if we're approaching limits
    isApproachingLimit(maxRequests = 1000) {
        const usage = this.getCurrentUsage();
        return usage.requests > (maxRequests * 0.8); // 80% of limit
    }
}

// Export singleton instance
const usageTracker = new UsageTracker();
module.exports = usageTracker;