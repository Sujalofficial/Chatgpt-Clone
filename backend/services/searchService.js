'use strict';

const axios = require('axios');

/**
 * Tavily Real-Time Search Service
 * 
 * Fetches verified, up-to-date data from the web.
 */
const search = async (query) => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
        console.error('⚠️ TAVILY_API_KEY is not set in .env');
        return null;
    }

    try {
        const response = await axios.post('https://api.tavily.com/search', {
            api_key: apiKey,
            query: query,
            search_depth: 'basic',
            include_answer: true,
            max_results: 5
        });

        return response.data;
    } catch (error) {
        console.error('❌ Tavily search error:', error.response?.data || error.message);
        return null;
    }
};

const formatSearchContext = (results) => {
    if (!results || !results.results) return "No real-time information found.";

    let context = "SEARCH RESULTS FROM TRUSTED SOURCES:\n\n";
    results.results.forEach((r, i) => {
        context += `[${i + 1}] Title: ${r.title}\n`;
        context += `    Content: ${r.content}\n`;
        context += `    URL: ${r.url}\n\n`;
    });
    
    if (results.answer) {
        context += `AI SUMMARY: ${results.answer}\n\n`;
    }

    return context;
};

module.exports = { search, formatSearchContext };
