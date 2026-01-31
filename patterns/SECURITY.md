# Aptos Move V2 Security Patterns

**Purpose:** Security checklist and patterns for secure Aptos Move V2 smart contracts.

**Target:** AI assistants generating Move V2 smart contracts

**Critical Note:** Security is non-negotiable. Every pattern here must be followed. User funds depend on it.

---

## Security Checklist

Before deploying any Move module, verify ALL items in this checklist:

### Access Control

- [ ] All `entry` functions verify signer authority with `assert!`
- [ ] Object ownership verified with `object::owner()` before operations
- [ ] Admin-only functions check caller is admin address
- [ ] Function visibility uses least-privilege (private > public(friend) > public > entry)
- [ ] No public functions that modify state without checks

### Input Validation

- [ ] Numeric inputs checked for zero where appropriate: `assert!(amount > 0, E_ZERO_AMOUNT)`
- [ ] Numeric inputs checked for overflow: `assert!(a <= MAX - b, E_OVERFLOW)`
- [ ] Vector lengths validated: `assert!(vector::length(&items) > 0, E_EMPTY_VECTOR)`
- [ ] String lengths checked: `assert!(string::length(&name) <= MAX_LENGTH, E_NAME_TOO_LONG)`
- [ ] Addresses validated as non-zero: `assert!(addr != @0x0, E_ZERO_ADDRESS)`
- [ ] Enum-like values within expected range: `assert!(type_id < MAX_TYPES, E_INVALID_TYPE)`

### Object Safety

- [ ] ConstructorRef never returned from public functions
- [ ] All refs (TransferRef, DeleteRef, ExtendRef) generated in constructor before ConstructorRef destroyed
- [ ] Object signer only used during construction or with ExtendRef
- [ ] Ungated transfers disabled unless explicitly needed
- [ ] DeleteRef only generated for truly burnable objects

### Reference Safety

- [ ] No `&mut` references exposed in public function signatures
- [ ] Critical fields protected from `mem::swap` attacks
- [ ] Mutable borrows minimized in scope
- [ ] No storing mutable references (impossible in Move, but watch for workarounds)

### Arithmetic Safety

- [ ] All additions checked for overflow
- [ ] All subtractions checked for underflow
- [ ] Division by zero prevented: `assert!(divisor > 0, E_DIVISION_BY_ZERO)`
- [ ] Use `checked_add`, `checked_sub`, `checked_mul` from safe math libraries

### Generic Type Safety

- [ ] Use `phantom` for generic types not stored in fields: `struct Vault<phantom CoinType>`
- [ ] Type witnesses used for authorization where appropriate
- [ ] Generic function constraints appropriate (`drop`, `copy`, `store`, `key`)

### Testing

- [ ] 100% line coverage achieved: `aptos move test --coverage`
- [ ] All error paths tested with `#[expected_failure(abort_code = E_CODE)]`
- [ ] Access control tested with multiple signers (owner, attacker)
- [ ] Input validation tested with invalid inputs (zero, overflow, empty)
- [ ] Edge cases covered (empty vectors, max values, boundary conditions)

### Reentrancy

- [ ] State updates before external calls (checks-effects-interactions pattern)
- [ ] No recursive calls that could manipulate state unexpectedly
- [ ] Watch for reentrancy through events or other modules

---

## Pattern 1: Access Control

### Verifying Signer Authority

**CORRECT - Always verify signer matches expected address:**

```move
const E_UNAUTHORIZED: u64 = 1;

/// Update global config (admin only)
public entry fun update_config(admin: &signer, new_value: u64) acquires Config {
    let config = borrow_global_mut<Config>(@my_addr);

    // ✅ CORRECT: Verify signer is admin
    assert!(signer::address_of(admin) == config.admin, E_UNAUTHORIZED);

    config.value = new_value;
}
```

**INCORRECT - No verification:**

```move
// ❌ DANGEROUS: Anyone can call this
public entry fun update_config(admin: &signer, new_value: u64) acquires Config {
    let config = borrow_global_mut<Config>(@my_addr);
    config.value = new_value; // No check!
}
```

### Verifying Object Ownership

**CORRECT - Check object ownership:**

```move
const E_NOT_OWNER: u64 = 2;

/// Transfer item (owner only)
public entry fun transfer_item(
    owner: &signer,
    item: Object<Item>,
    recipient: address
) acquires Item {
    // ✅ CORRECT: Verify signer owns object
    assert!(object::owner(item) == signer::address_of(owner), E_NOT_OWNER);

    // Safe to transfer
    let item_data = borrow_global_mut<Item>(object::object_address(&item));
    object::transfer_with_ref(
        object::generate_linear_transfer_ref(&item_data.transfer_ref),
        recipient
    );
}
```

**INCORRECT - No ownership check:**

```move
// ❌ DANGEROUS: Anyone can transfer anyone's items
public entry fun transfer_item(
    owner: &signer,
    item: Object<Item>,
    recipient: address
) acquires Item {
    // No ownership verification!
    let item_data = borrow_global_mut<Item>(object::object_address(&item));
    object::transfer_with_ref(
        object::generate_linear_transfer_ref(&item_data.transfer_ref),
        recipient
    );
}
```

### Role-Based Access Control

```move
module my_addr::marketplace {
    use std::signer;

    struct Marketplace has key {
        admin: address,
        operators: vector<address>,
        paused: bool,
    }

    const E_NOT_ADMIN: u64 = 1;
    const E_NOT_OPERATOR: u64 = 2;
    const E_PAUSED: u64 = 3;

    /// Admin-only function
    public entry fun add_operator(
        admin: &signer,
        operator: address
    ) acquires Marketplace {
        let marketplace = borrow_global_mut<Marketplace>(@my_addr);

        // Verify caller is admin
        assert!(signer::address_of(admin) == marketplace.admin, E_NOT_ADMIN);

        vector::push_back(&mut marketplace.operators, operator);
    }

    /// Operator-only function
    public entry fun pause_marketplace(operator: &signer) acquires Marketplace {
        let marketplace = borrow_global_mut<Marketplace>(@my_addr);

        // Verify caller is operator
        let operator_addr = signer::address_of(operator);
        assert!(
            vector::contains(&marketplace.operators, &operator_addr),
            E_NOT_OPERATOR
        );

        marketplace.paused = true;
    }

    /// Check if marketplace is active (used by other functions)
    fun assert_not_paused() acquires Marketplace {
        let marketplace = borrow_global<Marketplace>(@my_addr);
        assert!(!marketplace.paused, E_PAUSED);
    }
}
```

---

## Pattern 2: Input Validation

### Numeric Validation

```move
const E_ZERO_AMOUNT: u64 = 10;
const E_AMOUNT_TOO_HIGH: u64 = 11;
const E_INSUFFICIENT_BALANCE: u64 = 12;

const MAX_TRANSFER_AMOUNT: u64 = 1_000_000_000; // 1B with proper denomination

/// Transfer tokens with comprehensive validation
public entry fun transfer(
    from: &signer,
    to: address,
    amount: u64
) acquires Account {
    // ✅ Validate amount is non-zero
    assert!(amount > 0, E_ZERO_AMOUNT);

    // ✅ Validate amount is within reasonable bounds
    assert!(amount <= MAX_TRANSFER_AMOUNT, E_AMOUNT_TOO_HIGH);

    // ✅ Validate sender has sufficient balance
    let from_account = borrow_global<Account>(signer::address_of(from));
    assert!(from_account.balance >= amount, E_INSUFFICIENT_BALANCE);

    // ✅ Validate recipient is not zero address
    assert!(to != @0x0, E_ZERO_ADDRESS);

    // Safe to proceed
    // ... transfer logic
}
```

### String Validation

```move
const E_EMPTY_NAME: u64 = 20;
const E_NAME_TOO_LONG: u64 = 21;
const E_INVALID_CHARACTERS: u64 = 22;

const MAX_NAME_LENGTH: u64 = 32;

/// Set item name with validation
public entry fun set_name(
    owner: &signer,
    item: Object<Item>,
    name: String
) acquires Item {
    // ✅ Validate name is not empty
    assert!(string::length(&name) > 0, E_EMPTY_NAME);

    // ✅ Validate name length
    assert!(string::length(&name) <= MAX_NAME_LENGTH, E_NAME_TOO_LONG);

    // ✅ Validate ownership
    assert!(object::owner(item) == signer::address_of(owner), E_NOT_OWNER);

    // Optional: Validate character set (alphanumeric, no special chars, etc.)
    // This requires iteration and checking each byte

    let item_data = borrow_global_mut<Item>(object::object_address(&item));
    item_data.name = name;
}
```

### Vector Validation

```move
const E_EMPTY_VECTOR: u64 = 30;
const E_TOO_MANY_ITEMS: u64 = 31;
const E_DUPLICATE_ITEM: u64 = 32;

const MAX_ITEMS: u64 = 100;

/// Add items with validation
public entry fun add_items(
    owner: &signer,
    collection: Object<Collection>,
    items: vector<Object<Item>>
) acquires Collection {
    // ✅ Validate vector is not empty
    assert!(vector::length(&items) > 0, E_EMPTY_VECTOR);

    // ✅ Validate vector length
    let collection_data = borrow_global_mut<Collection>(object::object_address(&collection));
    let new_total = vector::length(&collection_data.items) + vector::length(&items);
    assert!(new_total <= MAX_ITEMS, E_TOO_MANY_ITEMS);

    // ✅ Validate no duplicates (if required)
    let i = 0;
    while (i < vector::length(&items)) {
        let item = *vector::borrow(&items, i);
        assert!(
            !vector::contains(&collection_data.items, &item),
            E_DUPLICATE_ITEM
        );
        i = i + 1;
    }

    // Safe to add items
    vector::append(&mut collection_data.items, items);
}
```

---

## Pattern 3: Arithmetic Safety

### Overflow Prevention

```move
const E_OVERFLOW: u64 = 40;
const E_UNDERFLOW: u64 = 41;

/// Safe addition
public fun safe_add(a: u64, b: u64): u64 {
    // Check overflow before addition
    assert!(a <= MAX_U64 - b, E_OVERFLOW);
    a + b
}

/// Safe subtraction
public fun safe_sub(a: u64, b: u64): u64 {
    // Check underflow before subtraction
    assert!(a >= b, E_UNDERFLOW);
    a - b
}

/// Safe multiplication (simplified - full version needs more checks)
public fun safe_mul(a: u64, b: u64): u64 {
    if (a == 0 || b == 0) {
        return 0
    };

    // Check overflow
    assert!(a <= MAX_U64 / b, E_OVERFLOW);
    a * b
}

/// Deposit with overflow check
public entry fun deposit(
    user: &signer,
    amount: u64
) acquires Account {
    let account = borrow_global_mut<Account>(signer::address_of(user));

    // ✅ Check addition won't overflow
    let new_balance = safe_add(account.balance, amount);

    account.balance = new_balance;
}
```

### Division Safety

```move
const E_DIVISION_BY_ZERO: u64 = 42;

/// Calculate percentage with safety checks
public fun calculate_fee(amount: u64, fee_basis_points: u64): u64 {
    // Basis points: 10000 = 100%, 100 = 1%
    assert!(fee_basis_points <= 10000, E_INVALID_FEE);

    if (amount == 0) {
        return 0
    };

    // Safe multiplication and division
    let fee = (amount * fee_basis_points) / 10000;
    fee
}
```

---

## Pattern 4: Object Security

### Never Return ConstructorRef

```move
// ❌ DANGEROUS: Exposes too much control
public fun create_item_wrong(creator: &signer): ConstructorRef {
    let constructor_ref = object::create_object(signer::address_of(creator));
    // DANGEROUS: Caller can delete object, generate arbitrary refs, etc.
    constructor_ref
}

// ✅ CORRECT: Return typed object
public fun create_item_correct(creator: &signer, name: String): Object<Item> {
    let constructor_ref = object::create_object(signer::address_of(creator));

    // Generate all needed refs
    let transfer_ref = object::generate_transfer_ref(&constructor_ref);
    let delete_ref = object::generate_delete_ref(&constructor_ref);

    let object_signer = object::generate_signer(&constructor_ref);

    move_to(&object_signer, Item {
        name,
        transfer_ref,
        delete_ref,
    });

    // Return safe typed reference
    object::object_from_constructor_ref<Item>(&constructor_ref)
}
```

### Generate All Refs in Constructor

```move
// ✅ CORRECT: All refs generated before ConstructorRef destroyed
public fun create_item(creator: &signer): Object<Item> {
    let constructor_ref = object::create_object(signer::address_of(creator));

    // Generate ALL refs you'll need NOW
    let transfer_ref = object::generate_transfer_ref(&constructor_ref);
    let delete_ref = object::generate_delete_ref(&constructor_ref);
    let extend_ref = object::generate_extend_ref(&constructor_ref);

    let object_signer = object::generate_signer(&constructor_ref);

    // Store refs for later use
    move_to(&object_signer, Item {
        name: string::utf8(b""),
        transfer_ref,
        delete_ref,
        extend_ref,
    });

    object::object_from_constructor_ref<Item>(&constructor_ref)
}

// ❌ WRONG: Can't generate refs later (ConstructorRef destroyed)
public fun add_delete_capability_later(item: Object<Item>) {
    // Can't do this - ConstructorRef is gone!
    // let delete_ref = object::generate_delete_ref(&???);
}
```

---

## Pattern 5: Reference Safety

### No Public Mutable References

```move
// ❌ DANGEROUS: Exposes mutable reference
public fun get_item_mut(item: Object<Item>): &mut Item acquires Item {
    // Allows caller to mem::swap fields, breaking invariants
    borrow_global_mut<Item>(object::object_address(&item))
}

// ✅ CORRECT: Expose specific operations
public entry fun update_item_name(
    owner: &signer,
    item: Object<Item>,
    new_name: String
) acquires Item {
    // Verify ownership
    assert!(object::owner(item) == signer::address_of(owner), E_NOT_OWNER);

    // Controlled mutation
    let item_data = borrow_global_mut<Item>(object::object_address(&item));
    item_data.name = new_name;
}
```

### Protect Against mem::swap

```move
use std::mem;

struct Item has key {
    name: String,
    // Critical field that must never change
    creator: address,
    transfer_ref: object::TransferRef,
}

// ❌ DANGEROUS: If attacker gets &mut Item, they can do this:
fun attacker_swap(item1: &mut Item, item2: &mut Item) {
    // Swaps ALL fields including creator and transfer_ref
    mem::swap(item1, item2);
    // Now ownership is confused!
}

// ✅ PROTECTION: Never expose &mut publicly
// Always use internal functions with checks
```

---

## Pattern 6: Generic Type Safety

### Use Phantom for Type Witnesses

```move
// ✅ CORRECT: Phantom type parameter (type not stored in fields)
struct Vault<phantom CoinType> has key {
    balance: u64,
    // CoinType is only used for type safety, not stored
}

/// Deposit specific coin type
public fun deposit<CoinType>(
    user: &signer,
    vault: Object<Vault<CoinType>>,
    amount: u64
) acquires Vault {
    // Type safety: can't deposit USDC into BTC vault
    let vault_data = borrow_global_mut<Vault<CoinType>>(object::object_address(&vault));
    vault_data.balance = vault_data.balance + amount;
}

// ❌ WRONG: Not using phantom (compiler error if CoinType not in fields)
struct Vault<CoinType> has key {
    balance: u64, // Where's CoinType used?
}
```

### Type Witness Pattern for Authorization

```move
/// Type witness pattern for authorization
struct AdminCapability has drop {}

/// Only callable with AdminCapability witness
public fun privileged_operation(_witness: AdminCapability, value: u64) acquires Config {
    // Caller must possess AdminCapability to call this
    let config = borrow_global_mut<Config>(@my_addr);
    config.value = value;
}

/// Get admin capability (restricted)
public fun get_admin_capability(admin: &signer): AdminCapability acquires Config {
    let config = borrow_global<Config>(@my_addr);
    assert!(signer::address_of(admin) == config.admin, E_NOT_ADMIN);

    AdminCapability {}
}
```

---

## Pattern 7: Reentrancy Protection

### Checks-Effects-Interactions Pattern

```move
/// Withdraw with reentrancy protection
public entry fun withdraw(
    user: &signer,
    amount: u64
) acquires Account {
    let user_addr = signer::address_of(user);

    // 1. CHECKS: Validate all conditions first
    assert!(amount > 0, E_ZERO_AMOUNT);
    let account = borrow_global<Account>(user_addr);
    assert!(account.balance >= amount, E_INSUFFICIENT_BALANCE);

    // 2. EFFECTS: Update state BEFORE external calls
    let account_mut = borrow_global_mut<Account>(user_addr);
    account_mut.balance = account_mut.balance - amount;

    // 3. INTERACTIONS: External calls LAST
    // If this calls back into our contract, state is already updated
    coin::transfer<AptosCoin>(user, user_addr, amount);
}

// ❌ WRONG: State updated after external call
public entry fun withdraw_vulnerable(
    user: &signer,
    amount: u64
) acquires Account {
    let user_addr = signer::address_of(user);

    // External call BEFORE state update
    coin::transfer<AptosCoin>(user, user_addr, amount);

    // Vulnerable: attacker can reenter and withdraw again
    let account = borrow_global_mut<Account>(user_addr);
    account.balance = account.balance - amount;
}
```

---

## Common Vulnerabilities

| Vulnerability            | Example                        | Impact                          | Fix                                                                        |
| ------------------------ | ------------------------------ | ------------------------------- | -------------------------------------------------------------------------- |
| Missing access control   | No signer verification         | Anyone can call admin functions | Add `assert!(signer::address_of(admin) == config.admin, E_NOT_ADMIN)`      |
| Missing ownership check  | No `object::owner()` check     | Anyone can modify any object    | Add `assert!(object::owner(obj) == signer::address_of(user), E_NOT_OWNER)` |
| Integer overflow         | `balance = balance + amount`   | Balance wraps to 0              | Check `assert!(balance <= MAX_U64 - amount, E_OVERFLOW)`                   |
| Integer underflow        | `balance = balance - amount`   | Balance wraps to MAX            | Check `assert!(balance >= amount, E_INSUFFICIENT)`                         |
| Division by zero         | `result = a / b`               | Abort without clear error       | Check `assert!(b > 0, E_DIVISION_BY_ZERO)`                                 |
| Returning ConstructorRef | `return constructor_ref`       | Caller can destroy object       | Return `Object<T>` instead                                                 |
| Exposing &mut            | `public fun get_mut(): &mut T` | mem::swap attacks               | Expose specific operations only                                            |
| No input validation      | Accept any `amount`            | Zero amounts, overflow          | Validate all inputs                                                        |
| Ungated transfers        | Enable for sensitive objects   | Unwanted transfers              | Only enable when appropriate                                               |
| Missing test coverage    | Some paths not tested          | Bugs in production              | Achieve 100% coverage                                                      |

---

## Security Testing Checklist

For each contract, write tests that cover:

### Access Control Tests

```move
#[test(owner = @0x1, attacker = @0x2)]
#[expected_failure(abort_code = E_NOT_OWNER)]
public fun test_unauthorized_transfer(owner: &signer, attacker: &signer) {
    let item = create_item(owner);
    transfer_item(attacker, item, @0x3); // Should abort
}
```

### Input Validation Tests

```move
#[test(user = @0x1)]
#[expected_failure(abort_code = E_ZERO_AMOUNT)]
public fun test_zero_amount_rejected(user: &signer) {
    transfer(user, @0x2, 0); // Should abort
}

#[test(user = @0x1)]
#[expected_failure(abort_code = E_AMOUNT_TOO_HIGH)]
public fun test_excessive_amount_rejected(user: &signer) {
    transfer(user, @0x2, MAX_TRANSFER_AMOUNT + 1); // Should abort
}
```

### Edge Case Tests

```move
#[test(user = @0x1)]
public fun test_max_amount_allowed(user: &signer) {
    setup_account(user, MAX_TRANSFER_AMOUNT);
    transfer(user, @0x2, MAX_TRANSFER_AMOUNT); // Should succeed
}

#[test(user = @0x1)]
public fun test_empty_vector_handling(user: &signer) {
    let items = vector::empty();
    process_items(user, items); // Should handle gracefully or abort with clear error
}
```

---

## Additional Resources

**Official Security Guidelines:**

- https://aptos.dev/build/smart-contracts/move-security-guidelines
- https://aptos.dev/build/smart-contracts/object

**Related Patterns:**

- `OBJECTS.md` - Object model security implications
- `TESTING.md` - Security testing patterns

---

**Remember:** Security is not optional. Every checklist item must pass before deployment. User funds depend on your
code's correctness.
