/// DELIBERATELY LEGACY (V1-style) CONTRACT -- for modernize-move eval testing only.
/// Uses deprecated patterns: resource accounts, coin module, no objects.
module my_addr::legacy_marketplace {
    use std::signer;
    use std::string::String;
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event::{Self, EventHandle};

    // ============ Error Codes ============

    const E_NOT_SELLER: u64 = 1;
    const E_NOT_FOUND: u64 = 2;
    const E_ALREADY_LISTED: u64 = 3;
    const E_INSUFFICIENT_FUNDS: u64 = 4;
    const E_NOT_ADMIN: u64 = 5;

    // ============ Structs ============

    /// OLD PATTERN: Uses global storage with move_to/borrow_global instead of Objects
    struct Listing has store, drop, copy {
        seller: address,
        item_name: String,
        price: u64,
        active: bool,
    }

    /// OLD PATTERN: Resource account-based marketplace state
    struct MarketplaceState has key {
        listings: vector<Listing>,
        resource_signer_cap: account::SignerCapability,
        admin: address,
        next_listing_id: u64,
        // OLD PATTERN: EventHandle instead of #[event] structs
        list_events: EventHandle<ListEvent>,
        purchase_events: EventHandle<PurchaseEvent>,
        cancel_events: EventHandle<CancelEvent>,
    }

    // OLD PATTERN: Event structs without #[event] attribute, used with EventHandle
    struct ListEvent has drop, store {
        listing_id: u64,
        seller: address,
        item_name: String,
        price: u64,
    }

    struct PurchaseEvent has drop, store {
        listing_id: u64,
        buyer: address,
        seller: address,
        price: u64,
    }

    struct CancelEvent has drop, store {
        listing_id: u64,
        seller: address,
    }

    // ============ Init ============

    /// OLD PATTERN: Uses resource account instead of named objects
    fun init_module(deployer: &signer) {
        let (resource_signer, resource_signer_cap) = account::create_resource_account(
            deployer,
            b"marketplace_v1",
        );

        move_to(&resource_signer, MarketplaceState {
            listings: vector::empty<Listing>(),
            resource_signer_cap,
            admin: signer::address_of(deployer),
            next_listing_id: 0,
            list_events: account::new_event_handle<ListEvent>(&resource_signer),
            purchase_events: account::new_event_handle<PurchaseEvent>(&resource_signer),
            cancel_events: account::new_event_handle<CancelEvent>(&resource_signer),
        });
    }

    // ============ Public Functions ============

    /// List an item for sale.
    /// OLD PATTERN: No #[view], no objects, uses vector::push_back,
    /// old event::emit_event with EventHandle.
    public entry fun list_item(
        seller: &signer,
        item_name: String,
        price: u64,
    ) acquires MarketplaceState {
        let seller_addr = signer::address_of(seller);
        let resource_addr = get_resource_address();
        let state = borrow_global_mut<MarketplaceState>(resource_addr);

        // OLD PATTERN: Linear scan with vector::borrow instead of table/index lookup
        let len = vector::length(&state.listings);
        let i = 0;
        while (i < len) {
            let listing = vector::borrow(&state.listings, i);
            if (listing.item_name == item_name && listing.seller == seller_addr && listing.active) {
                abort E_ALREADY_LISTED
            };
            i = i + 1;
        };

        let listing = Listing {
            seller: seller_addr,
            item_name,
            price,
            active: true,
        };

        vector::push_back(&mut state.listings, listing);

        let listing_id = state.next_listing_id;
        state.next_listing_id = listing_id + 1;

        // OLD PATTERN: event::emit_event with EventHandle instead of event::emit with #[event]
        event::emit_event(&mut state.list_events, ListEvent {
            listing_id,
            seller: seller_addr,
            item_name,
            price,
        });
    }

    /// Buy a listed item.
    /// OLD PATTERN: Uses coin::transfer instead of fungible_asset, no Object<T>.
    public entry fun buy_item(
        buyer: &signer,
        listing_index: u64,
    ) acquires MarketplaceState {
        let buyer_addr = signer::address_of(buyer);
        let resource_addr = get_resource_address();
        let state = borrow_global_mut<MarketplaceState>(resource_addr);

        let listing = vector::borrow_mut(&mut state.listings, listing_index);
        assert!(listing.active, E_NOT_FOUND);

        let price = listing.price;
        let seller = listing.seller;
        assert!(coin::balance<AptosCoin>(buyer_addr) >= price, E_INSUFFICIENT_FUNDS);

        // OLD PATTERN: coin::transfer instead of primary_fungible_store::transfer
        coin::transfer<AptosCoin>(buyer, seller, price);

        listing.active = false;

        // OLD PATTERN: emit_event instead of event::emit
        event::emit_event(&mut state.purchase_events, PurchaseEvent {
            listing_id: listing_index,
            buyer: buyer_addr,
            seller,
            price,
        });
    }

    /// Cancel a listing. Only the original seller can cancel.
    public entry fun cancel_listing(
        seller: &signer,
        listing_index: u64,
    ) acquires MarketplaceState {
        let seller_addr = signer::address_of(seller);
        let resource_addr = get_resource_address();
        let state = borrow_global_mut<MarketplaceState>(resource_addr);

        let listing = vector::borrow_mut(&mut state.listings, listing_index);
        assert!(listing.seller == seller_addr, E_NOT_SELLER);
        assert!(listing.active, E_NOT_FOUND);

        listing.active = false;

        event::emit_event(&mut state.cancel_events, CancelEvent {
            listing_id: listing_index,
            seller: seller_addr,
        });
    }

    // ============ Read Functions (no #[view]) ============

    /// OLD PATTERN: Regular public function instead of #[view]
    public fun get_listing(listing_index: u64): (address, String, u64, bool) acquires MarketplaceState {
        let resource_addr = get_resource_address();
        let state = borrow_global<MarketplaceState>(resource_addr);
        let listing = vector::borrow(&state.listings, listing_index);
        (listing.seller, listing.item_name, listing.price, listing.active)
    }

    /// OLD PATTERN: Regular public function instead of #[view], vector iteration
    public fun get_active_count(): u64 acquires MarketplaceState {
        let resource_addr = get_resource_address();
        let state = borrow_global<MarketplaceState>(resource_addr);
        let len = vector::length(&state.listings);
        let count = 0u64;
        let i = 0;
        while (i < len) {
            let listing = vector::borrow(&state.listings, i);
            if (listing.active) {
                count = count + 1;
            };
            i = i + 1;
        };
        count
    }

    // ============ Internal ============

    /// OLD PATTERN: Helper to derive resource account address
    fun get_resource_address(): address {
        account::create_resource_address(&@my_addr, b"marketplace_v1")
    }

    // ============ Test Helpers ============

    #[test_only]
    public fun init_for_test(deployer: &signer) {
        init_module(deployer);
    }
}
