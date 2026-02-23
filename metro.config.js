const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// Polyfill Node 20+ Array.prototype.toReversed if it doesn't exist
if (!Array.prototype.toReversed) {
    Array.prototype.toReversed = function () {
        return [...this].reverse();
    };
}

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
