/**
 * Unit tests for sum_to_n functions
 * Run with: node index.test.js
 */

const assert = require('assert');
const { sum_to_n_a, sum_to_n_b, sum_to_n_c } = require('./index.js');

// Test suite helper
function runTests() {
    let passedTests = 0;
    let failedTests = 0;

    function test(description, testFn) {
        try {
            testFn();
            console.log(`✓ ${description}`);
            passedTests++;
        } catch (error) {
            console.error(`✗ ${description}`);
            console.error(`  Error: ${error.message}`);
            failedTests++;
        }
    }

    console.log('Running Unit Tests for sum_to_n functions...\n');

    // Test sum_to_n_a
    console.log('--- Testing sum_to_n_a (Iterative) ---');
    test('sum_to_n_a(5) should return 15', () => {
        assert.strictEqual(sum_to_n_a(5), 15);
    });

    test('sum_to_n_a(10) should return 55', () => {
        assert.strictEqual(sum_to_n_a(10), 55);
    });

    test('sum_to_n_a(100) should return 5050', () => {
        assert.strictEqual(sum_to_n_a(100), 5050);
    });

    test('sum_to_n_a(1) should return 1', () => {
        assert.strictEqual(sum_to_n_a(1), 1);
    });

    test('sum_to_n_a(0) should return 0', () => {
        assert.strictEqual(sum_to_n_a(0), 0);
    });

    // Test sum_to_n_b
    console.log('\n--- Testing sum_to_n_b (Mathematical Formula) ---');
    test('sum_to_n_b(5) should return 15', () => {
        assert.strictEqual(sum_to_n_b(5), 15);
    });

    test('sum_to_n_b(10) should return 55', () => {
        assert.strictEqual(sum_to_n_b(10), 55);
    });

    test('sum_to_n_b(100) should return 5050', () => {
        assert.strictEqual(sum_to_n_b(100), 5050);
    });

    test('sum_to_n_b(1) should return 1', () => {
        assert.strictEqual(sum_to_n_b(1), 1);
    });

    test('sum_to_n_b(0) should return 0', () => {
        assert.strictEqual(sum_to_n_b(0), 0);
    });

    test('sum_to_n_b(1000) should return 500500', () => {
        assert.strictEqual(sum_to_n_b(1000), 500500);
    });

    // Test sum_to_n_c
    console.log('\n--- Testing sum_to_n_c (Recursive) ---');
    test('sum_to_n_c(5) should return 15', () => {
        assert.strictEqual(sum_to_n_c(5), 15);
    });

    test('sum_to_n_c(10) should return 55', () => {
        assert.strictEqual(sum_to_n_c(10), 55);
    });

    test('sum_to_n_c(100) should return 5050', () => {
        assert.strictEqual(sum_to_n_c(100), 5050);
    });

    test('sum_to_n_c(1) should return 1', () => {
        assert.strictEqual(sum_to_n_c(1), 1);
    });

    test('sum_to_n_c(0) should return 0', () => {
        assert.strictEqual(sum_to_n_c(0), 0);
    });

    // Cross-implementation consistency tests
    console.log('\n--- Testing Consistency Across Implementations ---');
    test('All implementations should return same result for n=7', () => {
        const result_a = sum_to_n_a(7);
        const result_b = sum_to_n_b(7);
        const result_c = sum_to_n_c(7);
        assert.strictEqual(result_a, result_b);
        assert.strictEqual(result_b, result_c);
        assert.strictEqual(result_a, 28);
    });

    test('All implementations should return same result for n=50', () => {
        const result_a = sum_to_n_a(50);
        const result_b = sum_to_n_b(50);
        const result_c = sum_to_n_c(50);
        assert.strictEqual(result_a, result_b);
        assert.strictEqual(result_b, result_c);
        assert.strictEqual(result_a, 1275);
    });

    test('All implementations should return same result for n=99', () => {
        const result_a = sum_to_n_a(99);
        const result_b = sum_to_n_b(99);
        const result_c = sum_to_n_c(99);
        assert.strictEqual(result_a, result_b);
        assert.strictEqual(result_b, result_c);
        assert.strictEqual(result_a, 4950);
    });

    // Summary
    console.log('\n========================================');
    console.log(`Total Tests: ${passedTests + failedTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log('========================================');

    if (failedTests === 0) {
        console.log('\n🎉 All tests passed!');
    } else {
        console.log(`\n❌ ${failedTests} test(s) failed.`);
        process.exit(1);
    }
}

// Run the tests
runTests();

