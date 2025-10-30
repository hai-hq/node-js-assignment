/**
 * Implementation A: Iterative approach using a for loop
 * 
 * Complexity Analysis:
 * - Time Complexity: O(n) - We iterate through n elements once
 * - Space Complexity: O(1) - Only uses a constant amount of extra space (sum variable)
 * 
 * Pros: Simple, readable, and straightforward
 * Cons: Not the most efficient for large values of n
 * 
 * @param {number} n - any integer
 * @returns {number} summation from 1 to n
 */
function sum_to_n_a(n) {
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
}

/**
 * Implementation B: Mathematical formula approach
 * Uses the arithmetic series formula: sum = n * (n + 1) / 2
 * 
 * Complexity Analysis:
 * - Time Complexity: O(1) - Constant time, just performs arithmetic operations
 * - Space Complexity: O(1) - No extra space required
 * 
 * Pros: Most efficient approach, constant time regardless of input size
 * Cons: Less intuitive for those unfamiliar with the mathematical formula
 * 
 * @param {number} n - any integer
 * @returns {number} summation from 1 to n
 */
function sum_to_n_b(n) {
    return (n * (n + 1)) / 2;
}

/**
 * Implementation C: Recursive approach
 * 
 * Complexity Analysis:
 * - Time Complexity: O(n) - Makes n recursive calls
 * - Space Complexity: O(n) - Uses call stack space for n recursive calls
 * 
 * Pros: Elegant and demonstrates functional programming concept
 * Cons: Least efficient due to function call overhead and stack space usage
 *       Risk of stack overflow for very large values of n
 * 
 * @param {number} n - any integer
 * @returns {number} summation from 1 to n
 */
function sum_to_n_c(n) {
    if (n <= 1) {
        return n;
    }
    return n + sum_to_n_c(n - 1);
}

// Test cases to verify all implementations
console.log("Testing sum_to_n_a:");
console.log("sum_to_n_a(5) =", sum_to_n_a(5)); // Expected: 15
console.log("sum_to_n_a(10) =", sum_to_n_a(10)); // Expected: 55
console.log("sum_to_n_a(100) =", sum_to_n_a(100)); // Expected: 5050

console.log("\nTesting sum_to_n_b:");
console.log("sum_to_n_b(5) =", sum_to_n_b(5)); // Expected: 15
console.log("sum_to_n_b(10) =", sum_to_n_b(10)); // Expected: 55
console.log("sum_to_n_b(100) =", sum_to_n_b(100)); // Expected: 5050

console.log("\nTesting sum_to_n_c:");
console.log("sum_to_n_c(5) =", sum_to_n_c(5)); // Expected: 15
console.log("sum_to_n_c(10) =", sum_to_n_c(10)); // Expected: 55
console.log("sum_to_n_c(100) =", sum_to_n_c(100)); // Expected: 5050

// Export the functions for use in other modules
module.exports = {
    sum_to_n_a,
    sum_to_n_b,
    sum_to_n_c
};

