module my_addr::nft_collection {
    use std::option;
    use std::signer;
    use std::string::{Self, String};
    use aptos_framework::event;
    use aptos_framework::object::{Self, Object};
    use aptos_token_objects::collection;
    use aptos_token_objects::token::{Self, Token};
    use aptos_token_objects::royalty;

    // ============ Constants ============

    const COLLECTION_NAME: vector<u8> = b"My NFT Collection";
    const COLLECTION_DESCRIPTION: vector<u8> = b"A curated collection of digital assets";
    const COLLECTION_URI: vector<u8> = b"https://mycollection.io/metadata";

    // ============ Error Codes ============

    const E_NOT_AUTHORIZED: u64 = 1;
    const E_NOT_OWNER: u64 = 2;
    const E_EMPTY_NAME: u64 = 3;
    const E_EMPTY_URI: u64 = 4;

    // ============ Structs ============

    /// Holds refs for managing individual tokens after creation
    struct TokenRefs has key {
        mutator_ref: token::MutatorRef,
        transfer_ref: object::TransferRef,
    }

    /// Tracks collection-level state, stored at the deployer address
    struct CollectionConfig has key {
        minted_count: u64,
    }

    // ============ Events ============

    #[event]
    struct NFTMinted has drop, store {
        token_address: address,
        token_name: String,
        creator: address,
        recipient: address,
    }

    #[event]
    struct NFTTransferred has drop, store {
        token_address: address,
        from: address,
        to: address,
    }

    // ============ Init Module ============

    fun init_module(deployer: &signer) {
        let royalty = royalty::create(5, 100, signer::address_of(deployer));

        collection::create_unlimited_collection(
            deployer,
            string::utf8(COLLECTION_DESCRIPTION),
            string::utf8(COLLECTION_NAME),
            option::some(royalty),
            string::utf8(COLLECTION_URI),
        );

        move_to(deployer, CollectionConfig {
            minted_count: 0,
        });
    }

    // ============ Entry Functions ============

    /// Mint a new NFT. Only the deployer (collection creator) can mint.
    public entry fun mint_nft(
        creator: &signer,
        recipient: address,
        token_name: String,
        token_description: String,
        token_uri: String,
    ) acquires CollectionConfig {
        let creator_addr = signer::address_of(creator);
        assert!(creator_addr == @my_addr, E_NOT_AUTHORIZED);
        assert!(string::length(&token_name) > 0, E_EMPTY_NAME);
        assert!(string::length(&token_uri) > 0, E_EMPTY_URI);

        let constructor_ref = token::create_named_token(
            creator,
            string::utf8(COLLECTION_NAME),
            token_description,
            token_name,
            option::none(),
            token_uri,
        );

        let token_signer = object::generate_signer(&constructor_ref);
        let token_address = object::address_from_constructor_ref(&constructor_ref);

        // Store management refs inside the token object
        let mutator_ref = token::generate_mutator_ref(&constructor_ref);
        let transfer_ref = object::generate_transfer_ref(&constructor_ref);

        move_to(&token_signer, TokenRefs {
            mutator_ref,
            transfer_ref,
        });

        // Transfer to recipient if different from creator
        if (recipient != creator_addr) {
            let token_obj = object::address_to_object<Token>(token_address);
            object::transfer(creator, token_obj, recipient);
        };

        // Update minted count
        let config = borrow_global_mut<CollectionConfig>(@my_addr);
        config.minted_count = config.minted_count + 1;

        event::emit(NFTMinted {
            token_address,
            token_name,
            creator: creator_addr,
            recipient,
        });
    }

    // ============ View Functions ============

    #[view]
    /// Return the total number of NFTs minted from this collection.
    public fun get_minted_count(): u64 acquires CollectionConfig {
        borrow_global<CollectionConfig>(@my_addr).minted_count
    }

    #[view]
    /// Return the name of a token given its object reference.
    public fun get_token_name(token: Object<Token>): String {
        token::name(token)
    }

    #[view]
    /// Return the URI of a token given its object reference.
    public fun get_token_uri(token: Object<Token>): String {
        token::uri(token)
    }

    #[view]
    /// Return the description of a token given its object reference.
    public fun get_token_description(token: Object<Token>): String {
        token::description(token)
    }

    // ============ Test Helpers ============

    #[test_only]
    public fun init_for_test(deployer: &signer) {
        init_module(deployer);
    }
}
