'use strict';

const cricketService = require('./cricketService');
const searchService = require('./searchService');
const intentService = require('./intentService');
const cacheService = require('./cacheService');

/**
 * AI Router Layer
 */
const routeRequest = async (messages) => {
    if (!messages || messages.length === 0) return { type: 'ai' };

    const lastMsgContent = (messages[messages.length - 1]?.content || '').toLowerCase();
    
    // Check Cache first
    const cached = cacheService.get(lastMsgContent);
    if (cached) return cached;

    // Fast Keyword Detection (Better for stability during dev)
    const cricketKeywords = ['ipl', 'match today', 'score', 'cricket', 'who won'];
    const newsKeywords = ['news', 'headlines', 'latest', 'today'];
    const searchKeywords = ['who is', 'where is', 'happened', 'score of'];

    let result = { type: 'ai' };

    // 1. Handle Cricket Intent
    if (cricketKeywords.some(k => lastMsgContent.includes(k))) {
        const matches = await cricketService.getLiveCricketMatches();
        result = {
            type: 'ai-augmented',
            context: `LIVE CRICKET DATA: ${JSON.stringify(matches)}`,
            intent: 'cricket'
        };
    } 
    // 2. Handle News/Search Intent
    else if (newsKeywords.some(k => lastMsgContent.includes(k)) || 
             searchKeywords.some(k => lastMsgContent.includes(k))) {
        
        const searchResults = await searchService.search(lastMsgContent);
        if (searchResults) {
            result = {
                type: 'ai-augmented', 
                context: searchService.formatSearchContext(searchResults),
                intent: 'search'
            };
        }
    }

    if (result.type !== 'ai') {
        cacheService.set(lastMsgContent, result);
    }
    return result;
};

module.exports = { routeRequest };
