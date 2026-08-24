const crypto = require("crypto");

/**
 * High-performance in-memory cache with SHA-256 stable hashing.
 * Deterministic generation outputs are cached to eliminate duplicate Gemini API calls.
 */

const cache = new Map();

/**
 * Build a safe SHA-256 hash key from any number of arbitrary string/object inputs
 */
function buildKey(...values) {
    const serialized = values
        .map(v => (typeof v === "object" && v !== null ? JSON.stringify(v) : String(v || "")))
        .join("|");

    return crypto
        .createHash("sha256")
        .update(serialized)
        .digest("hex");
}

/**
 * Get cached value
 */
function get(key) {
    return cache.get(key);
}

/**
 * Save cache
 */
function set(key, value) {
    cache.set(key, value);
    return value;
}

/**
 * Remove cache
 */
function remove(key) {
    cache.delete(key);
}

/**
 * Clear all cache
 */
function clear() {
    cache.clear();
}

/**
 * Wrap async function with cache
 */
async function wrap(key, callback) {
    if (cache.has(key)) {
        return cache.get(key);
    }

    const result = await callback();
    cache.set(key, result);
    return result;
}

module.exports = {
    buildKey,
    get,
    set,
    remove,
    clear,
    wrap
};