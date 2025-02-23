const formatMessage = (message) => {
    return `🔹 ${message}`;
};

const logInfo = (message) => {
    console.log(`ℹ️ INFO: ${formatMessage(message)}`);
};

const logWarning = (message) => {
    console.warn(`⚠️ WARNING: ${formatMessage(message)}`);
};

const logError = (message) => {
    console.error(`❌ ERROR: ${formatMessage(message)}`);
};

module.exports = {
    formatMessage,
    logInfo,
    logWarning,
    logError,
};
