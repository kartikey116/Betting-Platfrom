const { sortPanna } = require('./panna');

// Extremely simple manual test block to ensure correctness before writing full Jest
function testSortPanna() {
    const tests = [
        { input: '502', expected: '250' },
        { input: '123', expected: '123' },
        { input: '012', expected: '120' },
        { input: '090', expected: '900' },
        { input: '890', expected: '890' },
        { input: '333', expected: '333' },
        { input: '901', expected: '190' }
    ];

    let passed = true;
    for (const { input, expected } of tests) {
        const output = sortPanna(input);
        if (output !== expected) {
            console.error(`FAIL: sortPanna('${input}') -> Expected '${expected}', got '${output}'`);
            passed = false;
        }
    }

    if (passed) {
        console.log('All Panna sorting tests passed!');
    }
}

testSortPanna();
