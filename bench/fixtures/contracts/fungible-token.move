module my_addr::fungible_token {
    use std::option;
    use std::signer;
    use std::string;
    use aptos_framework::event;
    use aptos_framework::fungible_asset::{Self, Metadata, MintRef, BurnRef, TransferRef};
    use aptos_framework::object::{Self, Object};
    use aptos_framework::primary_fungible_store;

    // ============ Constants ============

    const TOKEN_NAME: vector<u8> = b"My Fungible Token";
    const TOKEN_SYMBOL: vector<u8> = b"MFT";
    const TOKEN_DECIMALS: u8 = 8;
    const TOKEN_ICON_URI: vector<u8> = b"https://mytoken.io/icon.png";
    const TOKEN_PROJECT_URI: vector<u8> = b"https://mytoken.io";
    const TOKEN_SEED: vector<u8> = b"MFT_SEED";

    // ============ Error Codes ============

    const E_NOT_ADMIN: u64 = 1;
    const E_ZERO_AMOUNT: u64 = 2;
    const E_ZERO_ADDRESS: u64 = 3;

    // ============ Structs ============

    /// Stores permission refs for minting, burning, and controlling transfers.
    /// Stored inside the metadata object, NOT in user accounts.
    struct ManagedRefs has key {
        mint_ref: MintRef,
        burn_ref: BurnRef,
        transfer_ref: TransferRef,
    }

    // ============ Events ============

    #[event]
    struct TokensMinted has drop, store {
        recipient: address,
        amount: u64,
    }

    #[event]
    struct TokensBurned has drop, store {
        account: address,
        amount: u64,
    }

    #[event]
    struct TokensTransferred has drop, store {
        sender: address,
        recipient: address,
        amount: u64,
    }

    // ============ Init Module ============

    fun init_module(deployer: &signer) {
        let constructor_ref = &object::create_named_object(deployer, TOKEN_SEED);

        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            constructor_ref,
            option::none(), // unlimited supply
            string::utf8(TOKEN_NAME),
            string::utf8(TOKEN_SYMBOL),
            TOKEN_DECIMALS,
            string::utf8(TOKEN_ICON_URI),
            string::utf8(TOKEN_PROJECT_URI),
        );

        let mint_ref = fungible_asset::generate_mint_ref(constructor_ref);
        let burn_ref = fungible_asset::generate_burn_ref(constructor_ref);
        let transfer_ref = fungible_asset::generate_transfer_ref(constructor_ref);

        let metadata_signer = object::generate_signer(constructor_ref);
        move_to(&metadata_signer, ManagedRefs {
            mint_ref,
            burn_ref,
            transfer_ref,
        });
    }

    // ============ Entry Functions ============

    /// Mint new tokens to recipient. Admin-only.
    public entry fun mint(admin: &signer, recipient: address, amount: u64) acquires ManagedRefs {
        assert!(signer::address_of(admin) == @my_addr, E_NOT_ADMIN);
        assert!(amount > 0, E_ZERO_AMOUNT);
        assert!(recipient != @0x0, E_ZERO_ADDRESS);

        let metadata = get_metadata();
        let refs = borrow_global<ManagedRefs>(object::object_address(&metadata));

        let fa = fungible_asset::mint(&refs.mint_ref, amount);
        primary_fungible_store::deposit(recipient, fa);

        event::emit(TokensMinted { recipient, amount });
    }

    /// Burn tokens from the caller's own account. Caller must hold enough tokens.
    public entry fun burn(account: &signer, amount: u64) acquires ManagedRefs {
        assert!(amount > 0, E_ZERO_AMOUNT);

        let metadata = get_metadata();
        let refs = borrow_global<ManagedRefs>(object::object_address(&metadata));

        let fa = primary_fungible_store::withdraw(account, metadata, amount);
        fungible_asset::burn(&refs.burn_ref, fa);

        event::emit(TokensBurned {
            account: signer::address_of(account),
            amount,
        });
    }

    /// Transfer tokens from sender to recipient using primary fungible stores.
    public entry fun transfer(sender: &signer, recipient: address, amount: u64) {
        assert!(amount > 0, E_ZERO_AMOUNT);
        assert!(recipient != @0x0, E_ZERO_ADDRESS);

        let metadata = get_metadata();
        primary_fungible_store::transfer(sender, metadata, recipient, amount);

        event::emit(TokensTransferred {
            sender: signer::address_of(sender),
            recipient,
            amount,
        });
    }

    // ============ View Functions ============

    #[view]
    /// Get the metadata object for this token.
    public fun get_metadata(): Object<Metadata> {
        let metadata_addr = object::create_object_address(&@my_addr, TOKEN_SEED);
        object::address_to_object<Metadata>(metadata_addr)
    }

    #[view]
    /// Get token balance for a given account.
    public fun balance(account: address): u64 {
        let metadata = get_metadata();
        primary_fungible_store::balance(account, metadata)
    }

    #[view]
    /// Get the current total supply, if tracked.
    public fun supply(): option::Option<u128> {
        let metadata = get_metadata();
        fungible_asset::supply(metadata)
    }

    #[view]
    /// Get the token name.
    public fun name(): string::String {
        let metadata = get_metadata();
        fungible_asset::name(metadata)
    }

    #[view]
    /// Get the token symbol.
    public fun symbol(): string::String {
        let metadata = get_metadata();
        fungible_asset::symbol(metadata)
    }

    // ============ Test Helpers ============

    #[test_only]
    public fun init_for_test(deployer: &signer) {
        init_module(deployer);
    }
}
