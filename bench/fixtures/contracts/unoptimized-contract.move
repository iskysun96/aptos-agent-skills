/// DELIBERATELY UNOPTIMIZED CONTRACT -- for gas-optimization eval testing only.
/// Contains multiple performance anti-patterns. Do NOT use as a reference.
module my_addr::unoptimized_registry {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use std::table::{Self, Table};

    // ============ Error Codes ============

    const E_NOT_FOUND: u64 = 1;
    const E_ALREADY_EXISTS: u64 = 2;

    // ============ Structs ============

    /// ANTI-PATTERN: Large struct that gets copied unnecessarily
    struct RegistryEntry has store, copy, drop {
        owner: address,
        name: String,
        description: String,
        tags: vector<String>,
        score: u64,
        created_at: u64,
    }

    /// ANTI-PATTERN: Uses a vector for lookups instead of SmartTable
    struct Registry has key {
        entries: vector<RegistryEntry>,
        // ANTI-PATTERN: Uses Table instead of SmartTable for large datasets
        name_index: Table<String, u64>,
        next_id: u64,
    }

    // ============ Init ============

    fun init_module(deployer: &signer) {
        move_to(deployer, Registry {
            entries: vector::empty<RegistryEntry>(),
            name_index: table::new<String, u64>(),
            next_id: 0,
        });
    }

    // ============ Entry Functions ============

    /// Register a new entry.
    /// ANTI-PATTERN: Excessive storage reads -- reads global state multiple times.
    public entry fun register(
        account: &signer,
        name: String,
        description: String,
    ) acquires Registry {
        let addr = signer::address_of(account);

        // ANTI-PATTERN: First borrow just to check existence
        let registry = borrow_global<Registry>(@my_addr);
        let exists = table::contains(&registry.name_index, name);
        assert!(!exists, E_ALREADY_EXISTS);

        // ANTI-PATTERN: Second borrow_global_mut instead of doing everything in one borrow
        let registry_mut = borrow_global_mut<Registry>(@my_addr);
        let id = registry_mut.next_id;

        let entry = RegistryEntry {
            owner: addr,
            name,
            description,
            tags: vector::empty<String>(),
            score: 0,
            created_at: 0,
        };

        vector::push_back(&mut registry_mut.entries, entry);
        table::add(&mut registry_mut.name_index, name, id);
        registry_mut.next_id = id + 1;
    }

    /// Find an entry by owner address.
    /// ANTI-PATTERN: Unbounded vector iteration -- scans every entry O(n).
    public fun find_by_owner(owner: address): vector<RegistryEntry> acquires Registry {
        let registry = borrow_global<Registry>(@my_addr);
        let results = vector::empty<RegistryEntry>();
        let len = vector::length(&registry.entries);
        let i = 0;
        while (i < len) {
            let entry = *vector::borrow(&registry.entries, i);
            if (entry.owner == owner) {
                // ANTI-PATTERN: Copies entire RegistryEntry struct including nested vectors
                vector::push_back(&mut results, entry);
            };
            i = i + 1;
        };
        results
    }

    /// Update the score for an entry by name.
    /// ANTI-PATTERN: Reads global state twice -- once for the index, once to mutate.
    public entry fun update_score(
        _account: &signer,
        name: String,
        new_score: u64,
    ) acquires Registry {
        // ANTI-PATTERN: First read for the index lookup
        let registry = borrow_global<Registry>(@my_addr);
        assert!(table::contains(&registry.name_index, name), E_NOT_FOUND);
        let idx = *table::borrow(&registry.name_index, name);

        // ANTI-PATTERN: Second mutable read when one borrow_global_mut would suffice
        let registry_mut = borrow_global_mut<Registry>(@my_addr);
        let entry = vector::borrow_mut(&mut registry_mut.entries, idx);
        entry.score = new_score;
    }

    /// Add a tag to an entry. Builds a concatenated label string in a loop.
    /// ANTI-PATTERN: Repeated string operations inside a loop.
    public entry fun add_tags(
        _account: &signer,
        name: String,
        tags: vector<String>,
    ) acquires Registry {
        let registry_mut = borrow_global_mut<Registry>(@my_addr);
        assert!(table::contains(&registry_mut.name_index, name), E_NOT_FOUND);
        let idx = *table::borrow(&registry_mut.name_index, name);
        let entry = vector::borrow_mut(&mut registry_mut.entries, idx);

        // ANTI-PATTERN: String concatenation in a loop to build a label
        let _label = string::utf8(b"tags:");
        let i = 0;
        let tag_len = vector::length(&tags);
        while (i < tag_len) {
            let tag = *vector::borrow(&tags, i);
            vector::push_back(&mut entry.tags, tag);
            // ANTI-PATTERN: Repeated string append in loop -- allocates new string each iteration
            string::append(&mut _label, tag);
            string::append_utf8(&mut _label, b",");
            i = i + 1;
        };
    }

    /// Count entries owned by a specific address.
    /// ANTI-PATTERN: Iterates entire vector just to count.
    public fun count_by_owner(owner: address): u64 acquires Registry {
        let registry = borrow_global<Registry>(@my_addr);
        let len = vector::length(&registry.entries);
        let count = 0u64;
        let i = 0;
        while (i < len) {
            let entry = vector::borrow(&registry.entries, i);
            if (entry.owner == owner) {
                count = count + 1;
            };
            i = i + 1;
        };
        count
    }

    // ============ Test Helpers ============

    #[test_only]
    public fun init_for_test(deployer: &signer) {
        init_module(deployer);
    }
}
