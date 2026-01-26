---
name: generate-tests
description:
  Generate comprehensive unit tests for Aptos Move V2 contracts with 100% coverage. Use when "write tests", "test
  contract", "add test coverage", or AUTOMATICALLY after writing any contract.
---

# Generate Tests Skill

## Overview

This skill generates comprehensive test suites for Move contracts with **100% line coverage** requirement. Tests verify:

- ✅ Happy paths (functionality works)
- ✅ Access control (unauthorized users blocked)
- ✅ Input validation (invalid inputs rejected)
- ✅ Edge cases (boundaries, limits, empty states)

**Critical Rule:** NEVER deploy without 100% test coverage.

## Core Workflow

### Step 1: Create Test Module

```move
#[test_only]
module my_addr::my_module_tests {
    use my_addr::my_module::{Self, MyObject};
    use aptos_framework::object::{Self, Object};
    use std::string;
    use std::signer;

    // Test constants
    const ADMIN_ADDR: address = @0x100;
    const USER_ADDR: address = @0x200;
    const ATTACKER_ADDR: address = @0x300;

    // ========== Setup Helpers ==========
    // (Reusable setup functions)

    // ========== Happy Path Tests ==========
    // (Basic functionality)

    // ========== Access Control Tests ==========
    // (Unauthorized access blocked)

    // ========== Input Validation Tests ==========
    // (Invalid inputs rejected)

    // ========== Edge Case Tests ==========
    // (Boundaries and limits)
}
```

### Step 2: Write Happy Path Tests

**Test basic functionality works correctly:**

```move
#[test(creator = @0x1)]
public fun test_create_object_succeeds(creator: &signer) {
    // Execute
    let obj = my_module::create_my_object(
        creator,
        string::utf8(b"Test Object")
    );

    // Verify
    assert!(object::owner(obj) == signer::address_of(creator), 0);
}

#[test(owner = @0x1)]
public fun test_update_object_succeeds(owner: &signer) {
    // Setup
    let obj = my_module::create_my_object(owner, string::utf8(b"Old Name"));

    // Execute
    let new_name = string::utf8(b"New Name");
    my_module::update_object(owner, obj, new_name);

    // Verify (if you have view functions)
    // assert!(my_module::get_object_name(obj) == new_name, 0);
}

#[test(owner = @0x1, recipient = @0x2)]
public fun test_transfer_object_succeeds(
    owner: &signer,
    recipient: &signer
) {
    let recipient_addr = signer::address_of(recipient);

    // Setup
    let obj = my_module::create_my_object(owner, string::utf8(b"Object"));
    assert!(object::owner(obj) == signer::address_of(owner), 0);

    // Execute
    my_module::transfer_object(owner, obj, recipient_addr);

    // Verify
    assert!(object::owner(obj) == recipient_addr, 1);
}
```

### Step 3: Write Access Control Tests

**Test unauthorized access is blocked:**

```move
#[test(owner = @0x1, attacker = @0x2)]
#[expected_failure(abort_code = my_module::E_NOT_OWNER)]
public fun test_non_owner_cannot_update(
    owner: &signer,
    attacker: &signer
) {
    let obj = my_module::create_my_object(owner, string::utf8(b"Object"));

    // Attacker tries to update (should abort)
    my_module::update_object(attacker, obj, string::utf8(b"Hacked"));
}

#[test(owner = @0x1, attacker = @0x2)]
#[expected_failure(abort_code = my_module::E_NOT_OWNER)]
public fun test_non_owner_cannot_transfer(
    owner: &signer,
    attacker: &signer
) {
    let obj = my_module::create_my_object(owner, string::utf8(b"Object"));

    // Attacker tries to transfer (should abort)
    my_module::transfer_object(attacker, obj, @0x3);
}

#[test(admin = @0x1, user = @0x2)]
#[expected_failure(abort_code = my_module::E_NOT_ADMIN)]
public fun test_non_admin_cannot_configure(
    admin: &signer,
    user: &signer
) {
    my_module::init_module(admin);

    // Regular user tries admin function (should abort)
    my_module::update_config(user, 100);
}
```

### Step 4: Write Input Validation Tests

**Test invalid inputs are rejected:**

```move
#[test(user = @0x1)]
#[expected_failure(abort_code = my_module::E_ZERO_AMOUNT)]
public fun test_zero_amount_rejected(user: &signer) {
    my_module::deposit(user, 0); // Should abort
}

#[test(user = @0x1)]
#[expected_failure(abort_code = my_module::E_AMOUNT_TOO_HIGH)]
public fun test_excessive_amount_rejected(user: &signer) {
    my_module::deposit(user, my_module::MAX_DEPOSIT_AMOUNT + 1); // Should abort
}

#[test(owner = @0x1)]
#[expected_failure(abort_code = my_module::E_EMPTY_NAME)]
public fun test_empty_string_rejected(owner: &signer) {
    let obj = my_module::create_my_object(owner, string::utf8(b"Initial"));
    my_module::update_object(owner, obj, string::utf8(b"")); // Empty - should abort
}

#[test(owner = @0x1)]
#[expected_failure(abort_code = my_module::E_NAME_TOO_LONG)]
public fun test_string_too_long_rejected(owner: &signer) {
    let obj = my_module::create_my_object(owner, string::utf8(b"Initial"));

    // String exceeding MAX_NAME_LENGTH
    let long_name = string::utf8(b"This is an extremely long name that exceeds the maximum allowed length");

    my_module::update_object(owner, obj, long_name); // Should abort
}

#[test(owner = @0x1)]
#[expected_failure(abort_code = my_module::E_ZERO_ADDRESS)]
public fun test_zero_address_rejected(owner: &signer) {
    let obj = my_module::create_my_object(owner, string::utf8(b"Object"));
    my_module::transfer_object(owner, obj, @0x0); // Should abort
}
```

### Step 5: Write Edge Case Tests

**Test boundary conditions:**

```move
#[test(user = @0x1)]
public fun test_max_amount_allowed(user: &signer) {
    my_module::init_account(user);

    // Exactly MAX_DEPOSIT_AMOUNT should work
    my_module::deposit(user, my_module::MAX_DEPOSIT_AMOUNT);

    // Verify
    assert!(my_module::get_balance(signer::address_of(user)) == my_module::MAX_DEPOSIT_AMOUNT, 0);
}

#[test(user = @0x1)]
public fun test_max_name_length_allowed(user: &signer) {
    // Create string exactly MAX_NAME_LENGTH long
    let max_name = string::utf8(b"12345678901234567890123456789012"); // 32 chars if MAX = 32

    // Should succeed
    let obj = my_module::create_my_object(user, max_name);
}

#[test(user = @0x1)]
public fun test_empty_collection_operations(user: &signer) {
    let collection = my_module::create_collection(user, string::utf8(b"Collection"));

    // Should handle empty collection gracefully
    assert!(my_module::get_collection_size(collection) == 0, 0);
}
```

### Step 6: Verify Coverage

**Run tests with coverage:**

```bash
# Run all tests
aptos move test

# Run with coverage
aptos move test --coverage

# Generate detailed coverage report
aptos move coverage source --module <module_name>

# Verify 100% coverage
aptos move coverage summary
```

**Coverage report example:**

```
module: my_module
coverage: 100.0% (150/150 lines covered)
```

**If coverage < 100%:**

1. Check uncovered lines in report
2. Write tests for missing paths
3. Repeat until 100%

## Test Template Structure

```move
#[test_only]
module my_addr::module_tests {
    use my_addr::module::{Self, Type};

    // ========== Setup Helpers ==========

    fun setup_default(): Object<Type> {
        // Common setup code
    }

    // ========== Happy Path Tests ==========

    #[test(user = @0x1)]
    public fun test_basic_operation_succeeds(user: &signer) {
        // Test happy path
    }

    // ========== Access Control Tests ==========

    #[test(owner = @0x1, attacker = @0x2)]
    #[expected_failure(abort_code = E_NOT_OWNER)]
    public fun test_unauthorized_access_fails(
        owner: &signer,
        attacker: &signer
    ) {
        // Test access control
    }

    // ========== Input Validation Tests ==========

    #[test(user = @0x1)]
    #[expected_failure(abort_code = E_INVALID_INPUT)]
    public fun test_invalid_input_rejected(user: &signer) {
        // Test input validation
    }

    // ========== Edge Case Tests ==========

    #[test(user = @0x1)]
    public fun test_boundary_condition(user: &signer) {
        // Test edge cases
    }
}
```

## Fuzzing and Property-Based Testing

### Step 7: Add Fuzzing Tests

Fuzzing tests help discover edge cases by testing with random inputs:

```move
#[test_only]
module my_addr::fuzz_tests {
    use my_addr::my_module;
    use std::vector;

    // ========== Random Input Generators ==========

    /// Generate random u64 in range
    fun random_u64(seed: u64, min: u64, max: u64): u64 {
        let range = max - min;
        min + (seed % (range + 1))
    }

    /// Generate random string of given length
    fun random_string(seed: u64, length: u64): String {
        let chars = b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = vector::empty<u8>();
        let i = 0;

        while (i < length) {
            let char_index = ((seed + i) * 17) % vector::length(&chars);
            vector::push_back(&mut result, *vector::borrow(&chars, char_index));
            i = i + 1;
        };

        string::utf8(result)
    }

    /// Generate random address
    fun random_address(seed: u64): address {
        // Create pseudo-random address from seed
        @0x0 + (seed * 0x10000000000000000)
    }

    // ========== Fuzzing Tests ==========

    #[test]
    public fun fuzz_test_deposit_amounts() {
        let user = account::create_account_for_test(@0x1);

        // Test 100 random valid amounts
        let seed = 42;
        let i = 0;

        while (i < 100) {
            let amount = random_u64(seed + i, 1, my_module::MAX_DEPOSIT_AMOUNT);

            // Should always succeed for valid amounts
            my_module::deposit(&user, amount);

            // Withdraw to reset
            my_module::withdraw(&user, amount);

            i = i + 1;
        }
    }

    #[test]
    public fun fuzz_test_string_inputs() {
        let user = account::create_account_for_test(@0x1);

        // Test various string lengths
        let seed = 123;
        let i = 0;

        while (i < 50) {
            let length = random_u64(seed + i, 1, my_module::MAX_NAME_LENGTH);
            let name = random_string(seed + i, length);

            // Should succeed for valid lengths
            let obj = my_module::create_named_object(&user, name);

            i = i + 1;
        }
    }

    // ========== Property-Based Tests ==========

    #[test]
    public fun property_test_balance_invariants() {
        let user1 = account::create_account_for_test(@0x1);
        let user2 = account::create_account_for_test(@0x2);

        // Property: Total balance is conserved in transfers
        let initial_amount = 1000000;
        my_module::deposit(&user1, initial_amount);

        let seed = 999;
        let i = 0;

        while (i < 20) {
            let transfer_amount = random_u64(seed + i, 1, initial_amount / 2);

            let balance1_before = my_module::get_balance(@0x1);
            let balance2_before = my_module::get_balance(@0x2);

            // Transfer
            my_module::transfer(&user1, @0x2, transfer_amount);

            let balance1_after = my_module::get_balance(@0x1);
            let balance2_after = my_module::get_balance(@0x2);

            // Property: Total balance unchanged
            assert!(
                balance1_before + balance2_before == balance1_after + balance2_after,
                0
            );

            // Property: Individual changes are correct
            assert!(balance1_after == balance1_before - transfer_amount, 1);
            assert!(balance2_after == balance2_before + transfer_amount, 2);

            i = i + 1;
        }
    }

    #[test]
    public fun property_test_ordering_invariants() {
        let user = account::create_account_for_test(@0x1);
        let collection = my_module::create_collection(&user);

        // Property: Items maintain insertion order
        let seed = 777;
        let items = vector::empty<u64>();
        let i = 0;

        while (i < 10) {
            let item_id = random_u64(seed + i, 1000, 9999);
            vector::push_back(&mut items, item_id);

            my_module::add_item(&user, collection, item_id);
            i = i + 1;
        };

        // Verify order preserved
        let retrieved_items = my_module::get_all_items(collection);
        assert!(retrieved_items == items, 0);
    }
}
```

### Fuzzing Best Practices

**Input Generation:**

```move
/// Generate biased random values (edge cases more likely)
fun biased_random_u64(seed: u64): u64 {
    let choice = seed % 10;

    if (choice == 0) {
        0  // Min value
    } else if (choice == 1) {
        MAX_U64  // Max value
    } else if (choice == 2) {
        1  // Just above min
    } else if (choice == 3) {
        MAX_U64 - 1  // Just below max
    } else {
        // Random in range
        random_u64(seed, 0, MAX_U64)
    }
}
```

**Stateful Fuzzing:**

```move
#[test]
public fun fuzz_test_state_machine() {
    let machine = my_module::create_state_machine();
    let seed = 12345;
    let i = 0;

    // Random sequence of operations
    while (i < 100) {
        let operation = seed % 4;

        match operation {
            0 => my_module::start_if_stopped(&machine),
            1 => my_module::pause_if_running(&machine),
            2 => my_module::resume_if_paused(&machine),
            3 => my_module::stop_if_not_stopped(&machine),
            _ => {},
        };

        // Verify state is always valid
        assert!(my_module::is_valid_state(&machine), i);

        seed = (seed * 17 + 11) % 1000000;
        i = i + 1;
    }
}
```

## Testing Checklist

For each contract, verify you have tests for:

**Happy Paths:**

- [ ] Object creation works
- [ ] State updates work
- [ ] Transfers work
- [ ] All main features work

**Access Control:**

- [ ] Non-owners cannot modify objects
- [ ] Non-admins cannot call admin functions
- [ ] Unauthorized users blocked

**Input Validation:**

- [ ] Zero amounts rejected
- [ ] Excessive amounts rejected
- [ ] Empty strings rejected
- [ ] Strings too long rejected
- [ ] Zero addresses rejected

**Edge Cases:**

- [ ] Maximum values work
- [ ] Minimum values work
- [ ] Empty states handled

**Fuzzing:**

- [ ] Random valid inputs handled
- [ ] Property invariants maintained
- [ ] State machine transitions valid
- [ ] No crashes or unexpected aborts

**Coverage:**

- [ ] 100% line coverage achieved
- [ ] All error codes tested
- [ ] All functions tested

## ALWAYS Rules

- ✅ ALWAYS achieve 100% test coverage
- ✅ ALWAYS test error paths with `#[expected_failure(abort_code = E_CODE)]`
- ✅ ALWAYS test access control with multiple signers
- ✅ ALWAYS test input validation with invalid inputs
- ✅ ALWAYS test edge cases (boundaries, limits, empty states)
- ✅ ALWAYS use clear test names: `test_feature_scenario`
- ✅ ALWAYS verify all state changes in tests
- ✅ ALWAYS run `aptos move test --coverage` before deployment
- ✅ ALWAYS add fuzzing tests for complex logic
- ✅ ALWAYS test property invariants (e.g., balance conservation)

## NEVER Rules

- ❌ NEVER deploy without 100% coverage
- ❌ NEVER skip testing error paths
- ❌ NEVER skip access control tests
- ❌ NEVER use unclear test names
- ❌ NEVER batch tests without verifying each case

## References

**Pattern Documentation:**

- `../../patterns/TESTING.md` - Comprehensive testing guide
- `../../patterns/SECURITY.md` - Security testing requirements

**Official Documentation:**

- https://aptos.dev/build/smart-contracts/book/unit-testing

**Related Skills:**

- `write-contracts` - Generate code to test
- `security-audit` - Verify security after testing

---

**Remember:** 100% coverage is mandatory. Test happy paths, error paths, access control, and edge cases.
