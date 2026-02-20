/**
 * Custom Panna Sorting Rule
 * Values: 1 < 2 < 3 < 4 < 5 < 6 < 7 < 8 < 9 < 0
 */
const PANNA_WEIGHTS = {
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '0': 10
};

/**
 * Sorts a string of digits according to the custom Panna rule.
 * Example: '502' -> '250', '000' -> '000', '901' -> '190'
 * 
 * @param {string} pannaStr - A string of digits (e.g., '123' or '502')
 * @returns {string} - The sorted string
 */
function sortPanna(pannaStr) {
    if (!pannaStr || typeof pannaStr !== 'string') return pannaStr;

    return pannaStr
        .split('')
        .sort((a, b) => PANNA_WEIGHTS[a] - PANNA_WEIGHTS[b])
        .join('');
}

module.exports = {
    sortPanna,
    PANNA_WEIGHTS
};
