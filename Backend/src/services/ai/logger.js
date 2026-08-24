/**
 * Simple logger used throughout the AI pipeline.
 * Can later be replaced with Winston or Pino
 * without changing other files.
 */

function format(level, message, meta = {}) {

    const timestamp = new Date().toISOString();

    console.log(
        `[${timestamp}] [${level}] ${message}`,
        Object.keys(meta).length ? meta : ""
    );

}

module.exports = {

    info(message, meta = {}) {
        format("INFO", message, meta);
    },

    warn(message, meta = {}) {
        format("WARN", message, meta);
    },

    error(message, meta = {}) {
        format("ERROR", message, meta);
    }

};