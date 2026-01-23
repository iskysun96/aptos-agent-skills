---
name: write-contracts
description: Generate and refactor Aptos Move V2 smart contracts following object-centric patterns, modern syntax, and security best practices. Use when "write move contract", "create smart contract", "build module", "refactor move code", "implement move function".
---

# Write Contracts Skill

## Overview

This skill guides you in writing secure, modern Aptos Move V2 smart contracts. Always follow this workflow:

1. **Search first**: Check aptos-core/move-examples for similar patterns
2. **Use objects**: Always use `Object<T>` references (never raw addresses)
3. **Security first**: Verify signers, validate inputs, protect references
4. **Modern syntax**: Use inline functions, lambdas, current object model
5. **Document clearly**: Add clear error codes and comments

## Core Workflow

### Step 1: Search for Examples

Before writing any new contract:

1. Search aptos-core/aptos-move/move-examples for similar functionality
2. Priority examples:
   - `hello_blockchain` - Basic module structure
   - `mint_nft` - NFT creation patterns
   - `token_objects` - Object-centric tokens
   - `fungible_asset` - Fungible token patterns
   - `dao` - Governance and voting
   - `marketplace` - Trading and escrow
3. Review official docs at https://aptos.dev/build/smart-contracts

### Step 2: Define Module Structure

```move
module my_addr::my_module {
    // ============ Imports ============
    use std::signer;
    use std::string::String;
    use std::vector;
    use aptos_framework::object::{Self, Object};

    // ============ Structs ============
    // Define your data structures

    // ============ Constants ============
    // Define error codes and constants

    // ============ Init Function ============
    // Optional: Module initialization

    // ============ Public Entry Functions ============
    // User-facing functions

    // ============ Public Functions ============
    // Composable functions

    // ============ Private Functions ============
    // Internal helpers
}
```

### Step 3: Implement Object Creation

**ALWAYS use this pattern for creating objects:**

```move
struct MyObject has key {
    name: String,
    // Store refs for later use
    transfer_ref: object::TransferRef,
    delete_ref: object::DeleteRef,
}

/// Create object with proper pattern
public fun create_my_object(creator: &signer, name: String): Object<MyObject> {
    // 1. Create object
    let constructor_ref = object::create_object(signer::address_of(creator));

    // 2. Generate ALL refs you'll need BEFORE constructor_ref is destroyed
    let transfer_ref = object::generate_transfer_ref(&constructor_ref);
    let delete_ref = object::generate_delete_ref(&constructor_ref);

    // 3. Get object signer
    let object_signer = object::generate_signer(&constructor_ref);

    // 4. Store data in object
    move_to(&object_signer, MyObject {
        name,
        transfer_ref,
        delete_ref,
    });

    // 5. Return typed object reference (ConstructorRef automatically destroyed)
    object::object_from_constructor_ref<MyObject>(&constructor_ref)
}
```

### Step 4: Add Access Control

**ALWAYS verify authorization in entry functions:**

```move
const E_NOT_OWNER: u64 = 1;
const E_NOT_ADMIN: u64 = 2;

/// Entry function with ownership verification
public entry fun update_object(
    owner: &signer,
    obj: Object<MyObject>,
    new_name: String
) acquires MyObject {
    // ✅ ALWAYS: Verify ownership
    assert!(object::owner(obj) == signer::address_of(owner), E_NOT_OWNER);

    // ✅ ALWAYS: Validate inputs
    assert!(string::length(&new_name) > 0, E_INVALID_INPUT);
    assert!(string::length(&new_name) <= MAX_NAME_LENGTH, E_NAME_TOO_LONG);

    // Safe to proceed
    let obj_data = borrow_global_mut<MyObject>(object::object_address(&obj));
    obj_data.name = new_name;
}
```

### Step 5: Implement Operations

**Use modern patterns for all operations:**

```move
/// Transfer with ownership check
public entry fun transfer_object(
    owner: &signer,
    obj: Object<MyObject>,
    recipient: address
) acquires MyObject {
    // Verify ownership
    assert!(object::owner(obj) == signer::address_of(owner), E_NOT_OWNER);

    // Validate recipient
    assert!(recipient != @0x0, E_ZERO_ADDRESS);

    // Transfer using stored ref
    let obj_data = borrow_global<MyObject>(object::object_address(&obj));
    object::transfer_with_ref(
        object::generate_linear_transfer_ref(&obj_data.transfer_ref),
        recipient
    );
}

/// Delete with ownership check
public entry fun burn_object(owner: &signer, obj: Object<MyObject>) acquires MyObject {
    // Verify ownership
    assert!(object::owner(obj) == signer::address_of(owner), E_NOT_OWNER);

    // Extract data and delete
    let obj_addr = object::object_address(&obj);
    let MyObject {
        name: _,
        transfer_ref: _,
        delete_ref,
    } = move_from<MyObject>(obj_addr);

    object::delete(delete_ref);
}
```

## ALWAYS Rules

When writing Move contracts, you MUST:

### Object Model
- ✅ Use `Object<T>` for all object references (NOT addresses)
- ✅ Generate all refs (TransferRef, DeleteRef) in constructor before ConstructorRef destroyed
- ✅ Return `Object<T>` from constructor functions (NEVER return ConstructorRef)
- ✅ Use `object::owner(obj)` to verify ownership
- ✅ Use `object::generate_signer(&constructor_ref)` for object signers

### Security
- ✅ Verify signer authority in ALL entry functions: `assert!(signer::address_of(user) == expected, E_UNAUTHORIZED)`
- ✅ Verify object ownership: `assert!(object::owner(obj) == signer::address_of(user), E_NOT_OWNER)`
- ✅ Validate ALL inputs:
  - Non-zero amounts: `assert!(amount > 0, E_ZERO_AMOUNT)`
  - Within limits: `assert!(amount <= MAX_AMOUNT, E_AMOUNT_TOO_HIGH)`
  - Non-zero addresses: `assert!(addr != @0x0, E_ZERO_ADDRESS)`
  - String lengths: `assert!(string::length(&name) <= MAX_LENGTH, E_NAME_TOO_LONG)`
- ✅ Use `phantom` for type witnesses: `struct Vault<phantom CoinType>`
- ✅ Protect critical fields from mem::swap attacks

### Error Handling
- ✅ Define clear error constants: `const E_NOT_OWNER: u64 = 1;`
- ✅ Use descriptive error names (E_NOT_OWNER, E_INSUFFICIENT_BALANCE, etc.)
- ✅ Group related errors (1-9: auth, 10-19: amounts, 20-29: validation)

### Modern Syntax
- ✅ Use inline functions for iteration: `inline fun for_each<T>(v: &vector<T>, f: |&T|)`
- ✅ Use lambdas for operations: `for_each(&items, |item| { process(item); })`
- ✅ Use proper imports: `use std::string::String;` not `use std::string;`

## NEVER Rules

When writing Move contracts, you MUST NEVER:

### Legacy Patterns
- ❌ NEVER use resource accounts (use named objects instead)
- ❌ NEVER use raw addresses for objects (use `Object<T>`)
- ❌ NEVER use `account::create_resource_account()` (deprecated)

### Security Violations
- ❌ NEVER return ConstructorRef from public functions
- ❌ NEVER expose `&mut` references in public functions
- ❌ NEVER skip signer verification in entry functions
- ❌ NEVER trust caller addresses without verification
- ❌ NEVER allow ungated transfers without good reason

### Bad Practices
- ❌ NEVER skip input validation
- ❌ NEVER use magic numbers for errors
- ❌ NEVER ignore overflow/underflow checks
- ❌ NEVER deploy without 100% test coverage

## Common Patterns

### Pattern 1: Named Objects (Singletons)

```move
/// Create singleton registry
public fun create_registry(admin: &signer): Object<Registry> {
    let constructor_ref = object::create_named_object(
        admin,
        b"REGISTRY_V1"  // Unique seed
    );

    let object_signer = object::generate_signer(&constructor_ref);

    move_to(&object_signer, Registry {
        admin: signer::address_of(admin),
        items: vector::empty(),
    });

    object::object_from_constructor_ref<Registry>(&constructor_ref)
}

/// Retrieve registry by reconstructing address
public fun get_registry(creator_addr: address): Object<Registry> {
    let registry_addr = object::create_object_address(&creator_addr, b"REGISTRY_V1");
    object::address_to_object<Registry>(registry_addr)
}
```

### Pattern 2: Collections (Objects Owning Objects)

```move
struct Collection has key {
    name: String,
    items: vector<Object<Item>>,
}

struct Item has key {
    name: String,
    parent: Object<Collection>,
}

/// Add item to collection
public entry fun add_item_to_collection(
    owner: &signer,
    collection: Object<Collection>,
    item_name: String
) acquires Collection {
    // Verify ownership
    assert!(object::owner(collection) == signer::address_of(owner), E_NOT_OWNER);

    // Create item owned by collection
    let collection_addr = object::object_address(&collection);
    let constructor_ref = object::create_object(collection_addr);

    let item_obj = object::object_from_constructor_ref<Item>(&constructor_ref);
    let object_signer = object::generate_signer(&constructor_ref);

    move_to(&object_signer, Item {
        name: item_name,
        parent: collection,
    });

    // Add to collection
    let collection_data = borrow_global_mut<Collection>(collection_addr);
    vector::push_back(&mut collection_data.items, item_obj);
}
```

### Pattern 3: Role-Based Access Control

```move
struct Marketplace has key {
    admin: address,
    operators: vector<address>,
    paused: bool,
}

const E_NOT_ADMIN: u64 = 1;
const E_NOT_OPERATOR: u64 = 2;

/// Admin-only function
public entry fun add_operator(
    admin: &signer,
    operator_addr: address
) acquires Marketplace {
    let marketplace = borrow_global_mut<Marketplace>(@my_addr);
    assert!(signer::address_of(admin) == marketplace.admin, E_NOT_ADMIN);

    vector::push_back(&mut marketplace.operators, operator_addr);
}

/// Operator-only function
public entry fun pause(operator: &signer) acquires Marketplace {
    let marketplace = borrow_global_mut<Marketplace>(@my_addr);
    let operator_addr = signer::address_of(operator);

    assert!(
        vector::contains(&marketplace.operators, &operator_addr),
        E_NOT_OPERATOR
    );

    marketplace.paused = true;
}
```

### Pattern 4: Safe Arithmetic

```move
const E_OVERFLOW: u64 = 10;
const E_UNDERFLOW: u64 = 11;
const E_INSUFFICIENT_BALANCE: u64 = 12;

const MAX_U64: u64 = 18446744073709551615;

/// Safe deposit
public entry fun deposit(user: &signer, amount: u64) acquires Account {
    assert!(amount > 0, E_ZERO_AMOUNT);

    let account = borrow_global_mut<Account>(signer::address_of(user));

    // Check overflow before adding
    assert!(account.balance <= MAX_U64 - amount, E_OVERFLOW);

    account.balance = account.balance + amount;
}

/// Safe withdrawal
public entry fun withdraw(user: &signer, amount: u64) acquires Account {
    assert!(amount > 0, E_ZERO_AMOUNT);

    let account = borrow_global_mut<Account>(signer::address_of(user));

    // Check underflow before subtracting
    assert!(account.balance >= amount, E_INSUFFICIENT_BALANCE);

    account.balance = account.balance - amount;
}
```

### Pattern 5: Inline Functions with Lambdas

```move
/// Filter items by predicate
inline fun filter_items<T: copy + drop>(
    items: &vector<T>,
    pred: |&T| bool
): vector<T> {
    let result = vector::empty<T>();
    let i = 0;
    while (i < vector::length(items)) {
        let item = vector::borrow(items, i);
        if (pred(item)) {
            vector::push_back(&mut result, *item);
        };
        i = i + 1;
    };
    result
}

/// Get expensive items (price > 1000)
public fun get_expensive_items(
    marketplace: Object<Marketplace>
): vector<Object<Item>> acquires Marketplace {
    let marketplace_data = borrow_global<Marketplace>(
        object::object_address(&marketplace)
    );

    filter_items(&marketplace_data.items, |item| {
        get_item_price(*item) > 1000
    })
}
```

### Pattern 6: Optional Values

```move
use std::option::{Self, Option};

/// Safe lookup that returns Option
public fun find_item_by_name(
    collection: Object<Collection>,
    name: String
): Option<Object<Item>> acquires Collection {
    let collection_data = borrow_global<Collection>(
        object::object_address(&collection)
    );

    let i = 0;
    while (i < vector::length(&collection_data.items)) {
        let item = *vector::borrow(&collection_data.items, i);
        // Assuming we have get_item_name function
        if (get_item_name(item) == name) {
            return option::some(item)
        };
        i = i + 1;
    };

    option::none()
}

/// Use optional value safely
public fun process_item_if_exists(
    collection: Object<Collection>,
    name: String
) acquires Collection {
    let item_opt = find_item_by_name(collection, name);

    if (option::is_some(&item_opt)) {
        let item = option::extract(&mut item_opt);
        // Process item
    } else {
        // Handle not found
    }
}
```

## Edge Cases to Handle

| Scenario | Check | Error Code |
|----------|-------|------------|
| Zero amounts | `assert!(amount > 0, E_ZERO_AMOUNT)` | E_ZERO_AMOUNT |
| Excessive amounts | `assert!(amount <= MAX, E_AMOUNT_TOO_HIGH)` | E_AMOUNT_TOO_HIGH |
| Empty vectors | `assert!(vector::length(&v) > 0, E_EMPTY_VECTOR)` | E_EMPTY_VECTOR |
| Empty strings | `assert!(string::length(&s) > 0, E_EMPTY_STRING)` | E_EMPTY_STRING |
| Strings too long | `assert!(string::length(&s) <= MAX, E_STRING_TOO_LONG)` | E_STRING_TOO_LONG |
| Zero address | `assert!(addr != @0x0, E_ZERO_ADDRESS)` | E_ZERO_ADDRESS |
| Overflow | `assert!(a <= MAX_U64 - b, E_OVERFLOW)` | E_OVERFLOW |
| Underflow | `assert!(a >= b, E_UNDERFLOW)` | E_UNDERFLOW |
| Division by zero | `assert!(divisor > 0, E_DIVISION_BY_ZERO)` | E_DIVISION_BY_ZERO |
| Unauthorized access | `assert!(signer == expected, E_UNAUTHORIZED)` | E_UNAUTHORIZED |
| Not object owner | `assert!(object::owner(obj) == user, E_NOT_OWNER)` | E_NOT_OWNER |

## Complete Example: NFT Collection

```move
module my_addr::nft_collection {
    use std::string::String;
    use std::signer;
    use std::vector;
    use aptos_framework::object::{Self, Object};

    // ============ Structs ============

    struct Collection has key {
        name: String,
        description: String,
        creator: address,
        nfts: vector<Object<NFT>>,
    }

    struct NFT has key {
        name: String,
        token_id: u64,
        collection: Object<Collection>,
        transfer_ref: object::TransferRef,
    }

    // ============ Constants ============

    const E_NOT_OWNER: u64 = 1;
    const E_NOT_CREATOR: u64 = 2;
    const E_EMPTY_NAME: u64 = 10;
    const E_NAME_TOO_LONG: u64 = 11;
    const E_ZERO_ADDRESS: u64 = 20;

    const MAX_NAME_LENGTH: u64 = 64;

    // ============ Public Entry Functions ============

    /// Create NFT collection
    public entry fun create_collection(
        creator: &signer,
        name: String,
        description: String
    ) {
        // Validate inputs
        assert!(string::length(&name) > 0, E_EMPTY_NAME);
        assert!(string::length(&name) <= MAX_NAME_LENGTH, E_NAME_TOO_LONG);

        let constructor_ref = object::create_named_object(
            creator,
            *string::bytes(&name)
        );

        let object_signer = object::generate_signer(&constructor_ref);

        move_to(&object_signer, Collection {
            name,
            description,
            creator: signer::address_of(creator),
            nfts: vector::empty(),
        });
    }

    /// Mint NFT into collection
    public entry fun mint_nft(
        creator: &signer,
        collection: Object<Collection>,
        nft_name: String,
        token_id: u64
    ) acquires Collection {
        // Verify creator owns collection
        let creator_addr = signer::address_of(creator);
        assert!(object::owner(collection) == creator_addr, E_NOT_CREATOR);

        // Validate input
        assert!(string::length(&nft_name) > 0, E_EMPTY_NAME);

        // Create NFT owned by collection
        let collection_addr = object::object_address(&collection);
        let constructor_ref = object::create_object(collection_addr);

        let transfer_ref = object::generate_transfer_ref(&constructor_ref);
        let object_signer = object::generate_signer(&constructor_ref);

        let nft_obj = object::object_from_constructor_ref<NFT>(&constructor_ref);

        move_to(&object_signer, NFT {
            name: nft_name,
            token_id,
            collection,
            transfer_ref,
        });

        // Add to collection
        let collection_data = borrow_global_mut<Collection>(collection_addr);
        vector::push_back(&mut collection_data.nfts, nft_obj);
    }

    /// Transfer NFT
    public entry fun transfer_nft(
        owner: &signer,
        nft: Object<NFT>,
        recipient: address
    ) acquires NFT {
        // Verify ownership
        assert!(object::owner(nft) == signer::address_of(owner), E_NOT_OWNER);

        // Validate recipient
        assert!(recipient != @0x0, E_ZERO_ADDRESS);

        // Transfer
        let nft_data = borrow_global<NFT>(object::object_address(&nft));
        object::transfer_with_ref(
            object::generate_linear_transfer_ref(&nft_data.transfer_ref),
            recipient
        );
    }

    // ============ Public View Functions ============

    #[view]
    public fun get_collection_size(collection: Object<Collection>): u64 acquires Collection {
        let collection_data = borrow_global<Collection>(
            object::object_address(&collection)
        );
        vector::length(&collection_data.nfts)
    }

    #[view]
    public fun get_nft_name(nft: Object<NFT>): String acquires NFT {
        let nft_data = borrow_global<NFT>(object::object_address(&nft));
        nft_data.name
    }
}
```

## References

**Official Documentation:**
- Object Model: https://aptos.dev/build/smart-contracts/object
- Security Guidelines: https://aptos.dev/build/smart-contracts/move-security-guidelines
- Move Book: https://aptos.dev/build/smart-contracts/book

**Example Repositories:**
- aptos-core/aptos-move/move-examples/

**Pattern Documentation (Local):**
- `../../patterns/OBJECTS.md` - Comprehensive object model guide
- `../../patterns/SECURITY.md` - Security checklist and patterns
- `../../patterns/MOVE_V2_SYNTAX.md` - Modern syntax examples

**Related Skills:**
- `generate-tests` - Write tests for contracts (use AFTER writing contracts)
- `security-audit` - Audit contracts before deployment
- `search-aptos-examples` - Find similar examples (use BEFORE writing)

---

**Remember:** Search examples first, use objects always, verify security, validate inputs, test everything.
