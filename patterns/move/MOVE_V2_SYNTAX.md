# Aptos Move V2 Modern Syntax Guide

**Purpose:** Guide to modern Move V2 syntax features including function values, enum types, positional structs, signed
integers, inline functions, lambdas, and current best practices.

**Target:** AI assistants generating Move V2 smart contracts

---

## Overview

Move V2 introduces modern syntax features that make code more concise, expressive, and safe:

- **Function values (Move 2.2+)**: First-class functions stored on-chain and passed across modules
- **Enum types (Move 2.0+)**: Variant types with pattern matching for state machines and data versioning
- **Positional structs (Move 2.0+)**: Wrapper types without named fields (`struct Amount(u64)`)
- **Signed integers (Move 2.3+)**: Native `i8` through `i256` types
- **Inline functions with lambdas**: Higher-order functions for iteration and control flow
- **Receiver-style method calls (Move 2.0+)**: Dot notation `value.func(arg)`
- **Index notation (Move 2.0+)**: `vector[i]` instead of `vector::borrow`
- **Compound assignments (Move 2.1+)**: `x += 1`, `x -= 1`
- **Modern object model**: Type-safe `Object<T>` instead of raw addresses
- **Improved error handling**: Clear error constants and abort codes

---

## Function Values (Move 2.2+)

Function values are first-class citizens in Move. Unlike inline functions, function values can cross module boundaries,
be stored on-chain, and enable dynamic dispatch.

### Function Types

```move
let f: |u64|bool;                   // Takes u64, returns bool
let g: |u64, bool|(bool, u64);     // Two params, returns tuple
let h: ||;                          // No params, no return
```

### Abilities on Function Types

```move
let f: |u64|bool has copy + drop;           // Can be used multiple times
let g: |u64|bool has copy + drop + store;   // Can be stored on-chain
```

Without abilities, a function value can only be moved and evaluated once.

### Creating Function Values

Public and entry functions are persistent by default and gain `store`:

```move
public fun is_even(x: u64): bool { x % 2 == 0 }

fun example() {
    let f: |u64|bool has copy + drop + store = is_even;
    assert!(f(4) == true, 0);
}
```

Non-public functions need `#[persistent]` to become storable:

```move
#[persistent]
fun is_odd(x: u64): bool { x % 2 == 1 }
```

Lambdas capture context variables by value:

```move
let threshold = 100;
let is_above = |x| x > threshold;
```

**Lambda restrictions:** Cannot capture references, cannot contain `return`. Parameters may need explicit type
annotations when the compiler cannot infer types.

### Currying Pattern

```move
fun add(x: u64, y: u64): u64 { x + y }

fun example() {
    let x = 22;
    let add_22: |u64|u64 has copy + drop + store = |y| add(x, y);
    assert!(add_22(8) == 30, 0);
}
```

### Storing Function Values On-Chain

```move
struct Plugin has key {
    handler: |u64|bool has copy + drop + store,
}

public fun register_plugin(account: &signer, handler: |u64|bool has copy + drop + store) {
    move_to(account, Plugin { handler });
}
```

### Reentrancy Safety

The VM detects module reentrancy when function values cause callbacks. Use `#[module_lock]` for strong protection:

```move
#[module_lock]
fun transfer(from: address, to: address, amount: u64, notify: |u64|) {
    account::withdraw(from, amount);
    notify(amount);  // Reentrancy attempts blocked
    account::deposit(to, amount);
}
```

See `SECURITY.md` Pattern 12 for full reentrancy safety guidance.

### Function Values vs Inline Functions

| Feature               | Inline Functions      | Function Values (2.2+)    |
| --------------------- | --------------------- | ------------------------- |
| Cross-module dispatch | No (same module only) | Yes                       |
| Stored on-chain       | No                    | Yes (with `store`)        |
| Runtime overhead      | None (inlined)        | Small (dynamic dispatch)  |
| Use case              | Iteration helpers     | Plugin systems, callbacks |

---

## Enum Types (Move 2.0+)

Enum types define different variants of data layout in a single type. They support three field styles: no fields,
positional fields, and named fields.

### Basic Enum Declaration

```move
/// Fieldless variants
enum Color has copy, drop { Red, Blue, Green }

/// Named fields
enum Shape has copy, drop {
    Circle { radius: u64 },
    Rectangle { width: u64, height: u64 },
}

/// Positional fields
enum Result<T> has copy, drop, store {
    Err(u64),
    Ok(T),
}
```

### Creating Enum Values

```move
let c = Color::Red;
let s = Shape::Circle { radius: 10 };
let r: Result<u64> = Result::Ok(42);
```

### Pattern Matching with `match`

The `match` expression destructures enums. The compiler enforces **exhaustive** matching -- all variants must be handled
or a wildcard `_` must be used.

#### Basic Match

```move
fun area(shape: &Shape): u64 {
    match (shape) {
        Shape::Circle { radius } => *radius * *radius * 314 / 100,
        Shape::Rectangle { width, height } => *width * *height,
    }
}
```

#### Mutable Reference Matching

```move
fun double_radius(shape: &mut Shape) {
    match (shape) {
        Shape::Circle { radius } => *radius = *radius * 2,
        _ => (),
    }
}
```

#### Nested Patterns with Guards

```move
fun describe(shape: &Shape): String {
    match (shape) {
        Shape::Circle { radius } if *radius == 0 => string::utf8(b"point"),
        Shape::Circle { radius } if *radius > 100 => string::utf8(b"large circle"),
        Shape::Circle { .. } => string::utf8(b"circle"),
        Shape::Rectangle { width, height } if *width == *height => string::utf8(b"square"),
        Shape::Rectangle { .. } => string::utf8(b"rectangle"),
    }
}
```

#### Name Resolution in Match Arms

Inside a match arm, variant field names are automatically in scope. Use `..` to ignore remaining fields:

```move
match (config) {
    Config::V1 { admin, .. } => *admin,
    Config::V2 { admin, .. } => *admin,
}
```

### Testing Variants with `is`

The `is` operator tests which variant a value holds without destructuring. Use `|` to test multiple variants:

```move
fun is_success<T>(result: &Result<T>): bool {
    result is Result::Ok
}

fun is_terminal(state: &OrderState): bool {
    state is OrderState::Completed | OrderState::Cancelled
}
```

### Direct Field Selection

You can access fields directly on an enum value using dot notation. This aborts at runtime if the value holds a
different variant.

```move
let s = Shape::Circle { radius: 10 };
let r = s.radius;  // OK: returns 10
// let w = s.width; // ABORT: Circle doesn't have 'width'
```

**Warning:** Prefer `match` over direct field selection in production code to avoid runtime aborts.

### Let Binding with Enums

You can use `let` to bind fields from a specific variant. The binding does **not** check exhaustiveness, so it aborts at
runtime if the variant doesn't match:

```move
let Shape::Circle { radius } = shape;
// Aborts if shape is not a Circle
```

### Destroying Enum Values

Enums without `drop` must be explicitly destructured to consume them:

```move
enum Token {
    Fungible { amount: u64 },
    NonFungible { id: u64 },
}

fun consume_token(token: Token) {
    match (token) {
        Token::Fungible { amount: _ } => (),
        Token::NonFungible { id: _ } => (),
    }
}
```

### Recursive Enums

Enums can be recursive using `Box` for heap allocation:

```move
enum Expr has drop {
    Literal(u64),
    Add(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
}

fun eval(expr: &Expr): u64 {
    match (expr) {
        Expr::Literal(value) => *value,
        Expr::Add(left, right) => eval(&*left) + eval(&*right),
        Expr::Mul(left, right) => eval(&*left) * eval(&*right),
    }
}
```

### Data Versioning Pattern

Enums with `key` are ideal for upgradeable contract data:

```move
enum Config has key {
    V1 { admin: address, fee_bps: u64 },
    V2 { admin: address, fee_bps: u64, paused: bool },
}

fun get_admin(config: &Config): address {
    match (config) {
        Config::V1 { admin, .. } => *admin,
        Config::V2 { admin, .. } => *admin,
    }
}

fun is_paused(config: &Config): bool {
    match (config) {
        Config::V1 { .. } => false,
        Config::V2 { paused, .. } => *paused,
    }
}
```

### Upgrade Compatibility Rules

When upgrading a module that declares an enum:

- **Original variants must appear first** in identical order
- **New variants can only be added at the end**
- **Existing abilities cannot be removed**
- **Runtime handling of missing variants:** If code adds a variant in an upgrade, existing `match` expressions from
  older code will not cover the new variant. Use a wildcard `_` arm to safely handle unknown future variants.

---

## Positional Structs (Move 2.0+)

Positional structs use unnamed fields accessed by position, ideal for newtype wrappers:

```move
/// Newtype wrappers for type safety
struct UserId(u64) has copy, drop, store;
struct OrderId(u64) has copy, drop, store;
struct Amount(u64) has copy, drop, store;

/// Can't accidentally mix up IDs
fun get_order(user: UserId, order: OrderId): Order {
    // Type system prevents passing OrderId as UserId
}
```

### Positional vs Named Fields

| Feature       | Positional (`struct Foo(u64)`)  | Named (`struct Foo { val: u64 }`) |
| ------------- | ------------------------------- | --------------------------------- |
| Access style  | `foo.0`                         | `foo.val`                         |
| Readability   | Brief, for simple wrappers      | Clear, for multi-field structs    |
| Destructuring | `let Foo(x) = foo`              | `let Foo { val: x } = foo`        |
| Best for      | Newtypes, single-field wrappers | Domain objects, configs           |

Positional fields also work in enum variants:

```move
enum Result<T> has copy, drop {
    Ok(T),
    Err(u64),
}
```

---

## Signed Integer Types (Move 2.3+)

Move 2.3 introduces native signed integer types:

| Type   | Size    | Range                           |
| ------ | ------- | ------------------------------- |
| `i8`   | 8-bit   | -128 to 127                     |
| `i16`  | 16-bit  | -32,768 to 32,767               |
| `i32`  | 32-bit  | -2,147,483,648 to 2,147,483,647 |
| `i64`  | 64-bit  | -9.2e18 to 9.2e18               |
| `i128` | 128-bit | -1.7e38 to 1.7e38               |
| `i256` | 256-bit | -5.8e76 to 5.8e76               |

### Builtin Constants

```move
let max = std::u64::MAX; // 18446744073709551615
let min = std::i32::MIN; // -2147483648
let max_signed = std::i64::MAX;
```

### Use Cases

```move
const E_INSUFFICIENT_BALANCE: u64 = 1;

/// Price deltas that can be negative
struct PriceDelta has copy, drop, store {
    delta_bps: i64,
}

/// Accounting with credits and debits
fun apply_adjustment(balance: u64, adjustment: i64): u64 {
    if (adjustment >= 0) {
        balance + (adjustment as u64)
    } else {
        let abs = (0 - adjustment) as u64;
        assert!(balance >= abs, E_INSUFFICIENT_BALANCE);
        balance - abs
    }
}
```

---

## For Loops (Move 2.0+)

**Always use `for` loops over `while` loops** when iterating with a counter. The `for` loop eliminates counter boilerplate and makes intent clear.

### Range-Based For Loop

```move
/// Sum numbers from 0 to n-1
fun sum(n: u64): u64 {
    let sum = 0;
    for (i in 0..n) {
        sum += i;
    };
    sum
}
```

- `for (i in 0..n)` — iterates `i` from `0` to `n-1` (upper bound is exclusive)
- `for (i in start..end)` — iterates from `start` to `end-1`
- Bounds are evaluated **once** at loop entry
- `break` and `continue` are supported

### Iterating Over Vectors

```move
/// Iterate over vector with for loop + index notation
fun sum_all(items: &vector<u64>): u64 {
    let total = 0;
    for (i in 0..items.length()) {
        total += items[i];
    };
    total
}
```

### When to Use Each Loop Style

| Style | When to Use |
|-------|-------------|
| `for (i in 0..n)` | **Default choice.** Counter-based iteration over ranges or vector indices |
| `vector::for_each_ref` / `vector::fold` / etc. | Functional-style iteration with lambdas (see Stdlib Inline Functions below) |
| `while` | When iteration count isn't known upfront: dynamic termination conditions, step size != 1, searching/draining |
| `loop` | Truly infinite loops (e.g., event loops). **Avoid** when a `while` with an exit condition would be clearer |

---

## Inline Functions & Lambdas

### Why Inline Functions Exist

`inline fun` means the compiler pastes the function body into every call site. This enables two things regular functions cannot do:

1. **Accept lambda parameters** — only inline functions can take lambdas like `|x| x + 1`
2. **Return references from borrowed state** — a regular function can't return `&T` or `&mut T` from `borrow_global` because the reference would escape the function scope. An inline function can, because after inlining the borrow stays within the caller's scope.

### Inline for Reference Returns

This is the primary code-reuse pattern for inline functions. A regular `fun` cannot return a reference to data borrowed from global storage — the compiler rejects it. `inline fun` solves this:

```move
/// Gets the game mutably — MUST be inline because it returns &mut from borrow_global_mut
inline fun get_game_mut(game_address: address, game_name: String): &mut TicTacToe {
    let store = get_store_mut(game_address);
    assert!(store.games.contains_key(&game_name), EGAME_NOT_FOUND);
    store.games.borrow_mut(&game_name)
}

/// Now callers can reuse the lookup + validation logic
public entry fun make_move(player: &signer, game_address: address, game_name: String, row: u64, col: u64) {
    let game = get_game_mut(game_address, game_name);
    game.board[row][col] = get_player_mark(player);
}

public entry fun reset_game(admin: &signer, game_address: address, game_name: String) {
    let game = get_game_mut(game_address, game_name);
    game.board = empty_board();
}
```

Remove `inline` and the compiler will fail — the `&mut TicTacToe` reference escapes the function scope.

### Inline for Lambda Parameters

```move
/// Custom inline function that takes a lambda (only define when stdlib doesn't have an equivalent)
inline fun for_each_pair<T>(v: &vector<T>, f: |&T, &T|) {
    let len = v.length() - 1;
    for (i in 0..len) {
        f(&v[i], &v[i + 1]);
    }
}

/// Usage with lambda
public fun has_adjacent_duplicates(numbers: &vector<u64>): bool {
    let found = false;
    for_each_pair(numbers, |a, b| {
        if (*a == *b) found = true;
    });
    found
}
```

### Lambda Syntax Variations

```move
// Single expression (no braces needed)
numbers.for_each_ref(|x| debug::print(x));

// Multiple statements (use braces)
numbers.for_each_ref(|x| {
    let doubled = *x * 2;
    debug::print(&doubled);
});

// With index — use stdlib enumerate_ref
items.enumerate_ref(|index, item| {
    debug::print(&string_utils::format2(&b"{}:{}", index, item));
});
```

### Stdlib Inline Functions (Prefer These)

The `std::vector` module provides inline functions for common iteration patterns. **Always use these instead of defining custom helpers.**

#### Iteration

```move
/// Read-only iteration
public fun print_all(numbers: &vector<u64>) {
    numbers.for_each_ref(|x| debug::print(x));
}

/// Mutable iteration
public fun double_all_in_place(numbers: &mut vector<u64>) {
    numbers.for_each_mut(|x| *x = *x * 2);
}

/// Consuming iteration (takes ownership)
public fun process_all(items: vector<Item>) {
    items.for_each(|item| consume_item(item));
}
```

#### Transform & Filter

```move
/// Map: transform each element into a new vector
public fun double_all(numbers: vector<u64>): vector<u64> {
    numbers.map(|x| x * 2)
}

/// Map by reference (non-consuming)
public fun get_names(items: &vector<Item>): vector<String> {
    items.map_ref(|item| item.name)
}

/// Filter: keep elements matching predicate
public fun keep_even(numbers: vector<u64>): vector<u64> {
    numbers.filter(|x| *x % 2 == 0)
}
```

#### Reduce & Search

```move
/// Fold: reduce vector to single value
public fun sum(numbers: vector<u64>): u64 {
    numbers.fold(0, |acc, x| acc + x)
}

/// Any: check if any element matches
public fun has_large_number(numbers: &vector<u64>): bool {
    numbers.any(|x| *x > 1000)
}

/// All: check if all elements match
public fun all_positive(numbers: &vector<u64>): bool {
    numbers.all(|x| *x > 0)
}
```

#### Zip Operations

```move
/// Zip two vectors together
public fun dot_product(a: vector<u64>, b: vector<u64>): u64 {
    let result = 0;
    a.zip(b, |x, y| result += x * y);
    result
}
```

### Custom Inline Functions

Only define custom inline helpers when no stdlib function fits. Prefer `for` loops for counter-based iteration inside custom helpers.

```move
/// Custom: sliding window pairs (no stdlib equivalent)
inline fun for_each_pair<T>(v: &vector<T>, f: |&T, &T|) {
    let len = v.length() - 1;
    for (i in 0..len) {
        f(&v[i], &v[i + 1]);
    }
}
```

### When to Use Inline Functions

| Use Case | Example |
|----------|---------|
| **Return references from borrowed state** | `inline fun get_game_mut(...): &mut TicTacToe` — reuse lookup/validation logic that returns `&T` or `&mut T` from `borrow_global` |
| **Accept lambda parameters** | `inline fun apply(f: \|u64\| u64, x: u64): u64` — higher-order functions |
| **Stdlib iteration** | Already provided: `vector::for_each_ref`, `vector::map`, `vector::fold`, etc. |

**Do NOT use inline when:** the function doesn't take lambdas and doesn't return references. Just use a regular `fun`. Inlining can increase *or* decrease gas cost depending on call-site count and code size — prefer regular `fun` for performance-neutral helpers.

### Inline Function Rules

1. **Use stdlib first** — `vector::for_each_ref`, `vector::map`, `vector::fold`, etc. cover most iteration patterns
2. **Use `inline` for reference-returning helpers** — the main code-reuse pattern for `inline fun`
3. **Prefer `for` loops for counter-based iteration** — use `while` only when the termination condition is dynamic
4. **Lambdas cannot use `break`, `continue`, or `return`** — if you need these, use a `for` loop directly
5. **Lambdas capture by value** — cannot capture references; captured mutable variables can be modified

---

## Modern Object Operations

### Object Creation Patterns

```move
use aptos_framework::object::{Self, Object, ConstructorRef};

/// Modern object creation
public fun create_item(creator: &signer, name: String): Object<Item> {
    // Create object with modern API
    let constructor_ref = object::create_object(signer::address_of(creator));

    // Generate refs in constructor
    let transfer_ref = object::generate_transfer_ref(&constructor_ref);
    let delete_ref = object::generate_delete_ref(&constructor_ref);

    // Get object signer
    let object_signer = object::generate_signer(&constructor_ref);

    // Store data
    move_to(&object_signer, Item {
        name,
        transfer_ref,
        delete_ref,
    });

    // Return typed object
    object::object_from_constructor_ref<Item>(&constructor_ref)
}
```

### Type-Safe Object References

```move
// MODERN: Type-safe object references
public entry fun transfer_item(
    owner: &signer,
    item: Object<Item>,  // Type-safe!
    recipient: address
) acquires Item {
    assert!(object::owner(item) == signer::address_of(owner), E_NOT_OWNER);

    let item_data = borrow_global_mut<Item>(object::object_address(&item));
    object::transfer_with_ref(
        object::generate_linear_transfer_ref(&item_data.transfer_ref),
        recipient
    );
}

// OLD: Raw addresses (avoid)
public entry fun transfer_item_old(
    owner: &signer,
    item_addr: address,  // No type safety
    recipient: address
) {
    // Manual type checking required
}
```

---

## Error Handling Patterns

### Clear Error Constants

```move
/// Modern error codes - descriptive constants
module my_addr::marketplace {
    // Group related errors
    const E_NOT_OWNER: u64 = 1;
    const E_NOT_ADMIN: u64 = 2;
    const E_UNAUTHORIZED: u64 = 3;

    const E_ZERO_AMOUNT: u64 = 10;
    const E_AMOUNT_TOO_HIGH: u64 = 11;
    const E_INSUFFICIENT_BALANCE: u64 = 12;

    const E_EMPTY_NAME: u64 = 20;
    const E_NAME_TOO_LONG: u64 = 21;

    const E_MARKETPLACE_PAUSED: u64 = 30;
    const E_ITEM_NOT_LISTED: u64 = 31;
    const E_ITEM_ALREADY_SOLD: u64 = 32;

    /// Use clear error messages
    public entry fun purchase_item(
        buyer: &signer,
        item: Object<Item>
    ) acquires Marketplace, Item {
        let marketplace = borrow_global<Marketplace>(@my_addr);

        // Clear error codes
        assert!(!marketplace.paused, E_MARKETPLACE_PAUSED);
        assert!(is_listed(item), E_ITEM_NOT_LISTED);
        assert!(!is_sold(item), E_ITEM_ALREADY_SOLD);

        // ... purchase logic
    }
}
```

---

## String Operations

### Modern String Handling

```move
use std::string::{Self, String};

/// Create strings
public fun create_strings() {
    // From bytes
    let s1 = string::utf8(b"Hello");

    // Append strings
    let s2 = string::utf8(b" World");
    string::append(&mut s1, s2);
    // s1 is now "Hello World"

    // Get length
    let len = string::length(&s1);

    // Compare strings
    assert!(s1 == string::utf8(b"Hello World"), 0);
}

/// Validate string
public fun validate_name(name: &String): bool {
    let len = string::length(name);
    len > 0 && len <= 32
}
```

---

## Vector Operations

### Modern Vector Patterns

```move
use std::vector;

/// Comprehensive vector operations
public fun vector_examples() {
    // Create empty vector
    let v = vector::empty<u64>();

    // Push elements
    vector::push_back(&mut v, 10);
    vector::push_back(&mut v, 20);
    vector::push_back(&mut v, 30);

    // Access elements
    let first = *vector::borrow(&v, 0);
    assert!(first == 10, 0);

    // Modify elements
    let elem = vector::borrow_mut(&mut v, 1);
    *elem = 25;

    // Pop element
    let last = vector::pop_back(&mut v);
    assert!(last == 30, 1);

    // Length
    let len = vector::length(&v);
    assert!(len == 2, 2);

    // Check contains
    assert!(vector::contains(&v, &10), 3);

    // Find index
    let (found, index) = vector::index_of(&v, &25);
    assert!(found && index == 1, 4);

    // Remove element
    let removed = vector::remove(&mut v, 0);
    assert!(removed == 10, 5);
}
```

### Vector with Lambdas

```move
/// Modern iteration using stdlib inline functions
public fun process_vector(numbers: vector<u64>) {
    // Filter with lambda
    let evens = numbers.filter(|x| *x % 2 == 0);

    // Transform with lambda
    let doubled = evens.map(|x| x * 2);

    // Sum with lambda
    let total = doubled.fold(0, |acc, x| acc + x);

    debug::print(&total);
}
```

### Vector Index Notation (Move 2)

Move 2 introduces cleaner syntax for vector access using index notation instead of `vector::borrow`.

**MODERN (V2 Syntax):**

```move
use std::vector;

struct Registry has key {
    items: vector<u64>,
}

// V2: Use index notation for reading
public fun get_item(registry: &Registry, index: u64): u64 {
    *&registry.items[index]  // Clean and readable
}

// V2: Use index notation for writing
public fun update_item(registry: &mut Registry, index: u64, value: u64) {
    *&mut registry.items[index] = value;  // Clean mutation
}

// V2: Iterate with for loop + index notation
fun sum_all(self: &Registry): u64 {
    let sum = 0;
    for (i in 0..self.items.length()) {
        sum += self.items[i];
    };
    sum
}
```

**OLD (Pre-V2 Syntax):**

```move
// OLD: vector::borrow syntax
public fun get_item_old(registry: &Registry, index: u64): u64 {
    *vector::borrow(&registry.items, index)  // More verbose
}

// OLD: vector::borrow_mut syntax
public fun update_item_old(registry: &mut Registry, index: u64, value: u64) {
    *vector::borrow_mut(&mut registry.items, index) = value;
}

// OLD: Iteration with while loop + borrow
fun sum_all_old(self: &Registry): u64 {
    let sum = 0;
    let i = 0;
    let len = vector::length(&self.items);

    while (i < len) {
        sum = sum + *vector::borrow(&self.items, i);  // Verbose
        i = i + 1;
    };

    sum
}
```

---

## Receiver-Style Method Calls (Move 2)

Move 2 introduced receiver-style function calls that allow using dot notation `value.func(arg)` instead of
`func(&value, arg)`.

### Defining Receiver Functions

Use `self` as the first parameter name to enable dot notation:

```move
module my_addr::items {
    use std::signer;
    use aptos_framework::object::{Self, Object};

    struct Item has key {
        owner: address,
        value: u64,
        name: String,
    }

    // MODERN: Use 'self' as first parameter
    public fun is_owner(self: &Object<Item>, user: &signer): bool acquires Item {
        let item_data = borrow_global<Item>(object::object_address(self));
        item_data.owner == signer::address_of(user)
    }

    public fun get_value(self: &Object<Item>): u64 acquires Item {
        let item_data = borrow_global<Item>(object::object_address(self));
        item_data.value
    }

    public fun get_name(self: &Object<Item>): String acquires Item {
        let item_data = borrow_global<Item>(object::object_address(self));
        item_data.name
    }

    // Mutable receiver
    public fun set_value(self: &Object<Item>, new_value: u64) acquires Item {
        let item_data = borrow_global_mut<Item>(object::object_address(self));
        item_data.value = new_value;
    }
}
```

### Using Receiver-Style Calls

```move
module my_addr::marketplace {
    use my_addr::items;

    // MODERN: Call with dot notation
    public entry fun update_item_if_owner(
        user: &signer,
        item: Object<Item>,
        new_value: u64
    ) {
        // Receiver-style call - reads much more naturally
        assert!(item.is_owner(user), E_NOT_OWNER);

        // Can chain multiple calls
        let current = item.get_value();
        assert!(new_value > current, E_VALUE_TOO_LOW);

        item.set_value(new_value);
    }

    // OLD: Traditional function call style
    public entry fun update_item_old_style(
        user: &signer,
        item: Object<Item>,
        new_value: u64
    ) {
        // Less readable function call syntax
        assert!(items::is_owner(&item, user), E_NOT_OWNER);
        let current = items::get_value(&item);
        items::set_value(&item, new_value);
    }
}
```

### Automatic Discovery

The compiler automatically discovers receiver functions - no need to import them explicitly:

```move
// Receiver functions are discovered automatically based on type
public fun use_item(item: Object<Item>) {
    // Compiler finds is_owner, get_value, etc. automatically
    // No need to: use my_addr::items::is_owner;
    let value = item.get_value();  // Works!
}
```

### Benefits of Receiver Style

1. **More readable**: `item.is_owner(user)` reads like English
2. **Familiar syntax**: Similar to methods in other languages
3. **Chainable**: `item.get_value() * 2` is cleaner
4. **Auto-discovery**: Compiler finds functions automatically

### Complete Example

```move
module marketplace_addr::listings {
    use std::signer;
    use aptos_framework::object::{Self, Object};

    struct Listing has key {
        seller: address,
        price: u64,
        active: bool,
    }

    // Define receiver-style functions with 'self'
    public fun is_active(self: &Object<Listing>): bool acquires Listing {
        let listing = borrow_global<Listing>(object::object_address(self));
        listing.active
    }

    public fun get_price(self: &Object<Listing>): u64 acquires Listing {
        let listing = borrow_global<Listing>(object::object_address(self));
        listing.price
    }

    public fun is_seller(self: &Object<Listing>, user: &signer): bool acquires Listing {
        let listing = borrow_global<Listing>(object::object_address(self));
        listing.seller == signer::address_of(user)
    }

    public fun deactivate(self: &Object<Listing>) acquires Listing {
        let listing = borrow_global_mut<Listing>(object::object_address(self));
        listing.active = false;
    }

    // Use receiver style in other functions
    public entry fun cancel_listing(
        seller: &signer,
        listing: Object<Listing>
    ) acquires Listing {
        assert!(listing.is_active(), E_ALREADY_INACTIVE);
        assert!(listing.is_seller(seller), E_NOT_SELLER);

        listing.deactivate();
    }

    public entry fun purchase_listing(
        buyer: &signer,
        listing: Object<Listing>
    ) acquires Listing {
        assert!(listing.is_active(), E_NOT_ACTIVE);

        let price = listing.get_price();
        // ... payment logic ...

        listing.deactivate();
    }
}
```

---

## Option Type

### Working with Option<T>

```move
use std::option::{Self, Option};

/// Option patterns
public fun option_examples() {
    // Create Some
    let some_value = option::some(42);

    // Create None
    let none_value = option::none<u64>();

    // Check if some
    assert!(option::is_some(&some_value), 0);
    assert!(option::is_none(&none_value), 1);

    // Extract value (aborts if None)
    let value = option::extract(&mut some_value);
    assert!(value == 42, 2);

    // Borrow value (aborts if None)
    let some_value2 = option::some(100);
    let borrowed = option::borrow(&some_value2);
    assert!(*borrowed == 100, 3);
}

/// Safe option handling
public fun safe_divide(a: u64, b: u64): Option<u64> {
    if (b == 0) {
        option::none()
    } else {
        option::some(a / b)
    }
}

/// Using option in functions
public fun calculate_with_option(a: u64, b: u64): u64 {
    let result = safe_divide(a, b);

    if (option::is_some(&result)) {
        option::extract(&mut result)
    } else {
        0 // Default value
    }
}
```

---

## Abilities and Constraints

### Modern Ability Usage

```move
/// Phantom types for type safety
struct Vault<phantom CoinType> has key {
    balance: u64,
}

/// Copy + Drop for value types
struct Point has copy, drop {
    x: u64,
    y: u64,
}

/// Store for nested resources
struct Container has key, store {
    value: u64,
}

/// Key for global storage
struct GlobalConfig has key {
    admin: address,
    value: u64,
}

/// Generic with ability constraints
public fun process_copyable<T: copy + drop>(item: T) {
    let copy_of_item = item;
    // Both item and copy_of_item can be used
}
```

---

## Module Structure

### Modern Module Organization

```move
module my_addr::marketplace {
    // ============ Imports ============
    use std::signer;
    use std::string::String;
    use std::vector;
    use aptos_framework::object::{Self, Object};

    // ============ Structs ============
    struct Marketplace has key {
        items: vector<Object<Item>>,
        admin: address,
        paused: bool,
    }

    struct Item has key {
        name: String,
        price: u64,
        seller: address,
        transfer_ref: object::TransferRef,
    }

    // ============ Constants ============
    const E_NOT_ADMIN: u64 = 1;
    const E_NOT_OWNER: u64 = 2;
    const E_MARKETPLACE_PAUSED: u64 = 3;

    const MAX_ITEMS: u64 = 1000;

    // ============ Init Functions ============
    fun init_module(admin: &signer) {
        move_to(admin, Marketplace {
            items: vector::empty(),
            admin: signer::address_of(admin),
            paused: false,
        });
    }

    // ============ Public Entry Functions ============
    public entry fun list_item(
        seller: &signer,
        item: Object<Item>,
        price: u64
    ) acquires Marketplace {
        // ... implementation
    }

    // ============ Public Functions ============
    public fun get_item_price(item: Object<Item>): u64 acquires Item {
        let item_data = borrow_global<Item>(object::object_address(&item));
        item_data.price
    }

    // ============ Private Functions ============
    fun assert_not_paused() acquires Marketplace {
        let marketplace = borrow_global<Marketplace>(@my_addr);
        assert!(!marketplace.paused, E_MARKETPLACE_PAUSED);
    }

    // ============ Inline Helpers ============
    inline fun for_each_item(f: |&Object<Item>|) acquires Marketplace {
        let marketplace = borrow_global<Marketplace>(@my_addr);
        &marketplace.items.for_each_ref(|item| {
            f(item);
        });
    }

    // ============ Test Module ============
    #[test_only]
    module marketplace_tests {
        // ... tests
    }
}
```

---

## Additional Move 2 Syntax Features

### Compound Assignments (Move 2.1+)

```move
x += 1;
x -= amount;
x *= 2;
x /= divisor;
x %= modulus;
```

### Loop Labels (Move 2.1+)

Labels can only be applied to `while` and `loop` — not `for`.

```move
'outer: while (row < rows) {
    let col = 0;
    while (col < cols) {
        if (grid[row][col] == target) break 'outer;
        col += 1;
    };
    row += 1;
};
```

### Dot-Dot Patterns (Move 2.1+)

Ignore remaining fields in struct destructuring:

```move
let Config::V2 { admin, .. } = config;
```

### Package Visibility (Move 2.1+)

```move
package fun internal_helper() {
    // Visible to other modules in same package, but not to external packages
}
```

---

## Best Practices Summary

**DO:**

- ✅ Use function values for cross-module callbacks and plugin systems (Move 2.2+)
- ✅ Use enum types for variant data and state machines (Move 2.0+)
- ✅ Use positional structs for newtype wrappers (`struct Amount(u64)`)
- ✅ Use signed integers (`i8`-`i256`) for deltas and offsets (Move 2.3+)
- ✅ Use `#[module_lock]` when function value callbacks must not re-enter your module
- ✅ Use `match` expressions for exhaustive enum handling
- ✅ Add wildcard `_` arms in `match` for future upgrade compatibility
- ✅ Use `for` loops for counter-based iteration — prefer `for (i in 0..n)` over manual counter `while` loops
- ✅ Use stdlib inline functions for vector iteration — receiver style: `v.for_each_ref(|x| ...)`, `v.map(|x| ...)`, `v.fold(init, |acc, x| ...)`
- ✅ Use lambdas for concise operation definitions
- ✅ Only define custom inline functions when no stdlib equivalent exists
- ✅ Use `Object<T>` for type-safe object references
- ✅ Define clear error constants with descriptive names
- ✅ Group related functionality in modules
- ✅ Use phantom types for type witnesses
- ✅ Use Option<T> for optional values
- ✅ Use `init_module(deployer: &signer)` for contract initialization
- ✅ Emit events with `#[event]` attribute and `event::emit()`
- ✅ Use receiver-style method calls with `self` parameter
- ✅ Use vector index notation `vector[i]` instead of `vector::borrow`
- ✅ Use direct named addresses `@addr` instead of helper functions

**DON'T:**

- ❌ Use raw addresses instead of `Object<T>`
- ❌ Use magic numbers for errors (use named constants)
- ❌ Ignore ability constraints on generics
- ❌ Mix old and new patterns in same codebase
- ❌ Create helper functions that just return named addresses
- ❌ Skip event emission for significant activities
- ❌ Use old syntax (`vector::borrow`) when V2 syntax (`vector[i]`) is available
- ❌ Use `while` loops with manual counters when `for (i in 0..n)` works
- ❌ Define custom `for_each`/`map`/`fold` helpers when stdlib versions exist (use `v.for_each_ref(...)`, `v.map(...)`, etc.)
- ❌ Skip `init_module` when contracts need initialization
- ❌ Use custom signed integer libraries when native `i8`-`i256` types are available
- ❌ Store function values without considering reentrancy implications
- ❌ Use direct field selection on enums in production code (prefer `match`)
- ❌ Use structs for state machines when enums are a better fit
- ❌ Reorder enum variants during upgrades (breaks compatibility)

---

## Additional Resources

**Official Documentation:**

- Move Book: https://aptos.dev/build/smart-contracts/book
- Move 2 Release Notes: https://aptos.dev/build/smart-contracts/book/move-2
- Functions (incl. function values): https://aptos.dev/build/smart-contracts/book/functions
- Enums: https://aptos.dev/build/smart-contracts/book/enums
- Object Model: https://aptos.dev/build/smart-contracts/object
- Generics: https://aptos.dev/build/smart-contracts/book/generics

**Related Patterns:**

- `OBJECTS.md` - Detailed object patterns
- `SECURITY.md` - Security with modern syntax (incl. reentrancy safety)
- `ADVANCED_TYPES.md` - Advanced type patterns (enums, phantom types, generics)
- `TESTING.md` - Testing modern code

---

**Remember:** Use modern Move V2 syntax for cleaner, safer, more maintainable code. Embrace `for` loops for counter-based iteration, stdlib inline functions, lambdas, function values, enums, and type-safe objects. Use `while` when the termination condition is dynamic.
