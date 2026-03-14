/// DELIBERATELY INSECURE CONTRACT -- for security-audit eval testing only.
/// Contains multiple known vulnerabilities. Do NOT use as a reference.
module my_addr::insecure_vault {
    use std::signer;
    use aptos_framework::fungible_asset::{Self, Metadata, MintRef, BurnRef, TransferRef, FungibleAsset};
    use aptos_framework::object::{Self, Object, ConstructorRef};
    use aptos_framework::primary_fungible_store;

    // ============ Error Codes ============

    const E_INSUFFICIENT_BALANCE: u64 = 1;

    // ============ Structs ============

    struct VaultRefs has key {
        mint_ref: MintRef,
        burn_ref: BurnRef,
        transfer_ref: TransferRef,
    }

    struct VaultState has key {
        total_deposited: u64,
        total_withdrawn: u64,
    }

    // ============ Init ============

    fun init_module(deployer: &signer) {
        move_to(deployer, VaultState {
            total_deposited: 0,
            total_withdrawn: 0,
        });
    }

    // ============ VULNERABILITY 1: Missing access control ============
    // Anyone can call this function and withdraw tokens to an arbitrary
    // recipient. The `_anyone` signer is accepted but never checked.

    public entry fun withdraw_tokens(
        _anyone: &signer,
        metadata: Object<Metadata>,
        recipient: address,
        amount: u64,
    ) acquires VaultRefs, VaultState {
        let refs = borrow_global<VaultRefs>(object::object_address(&metadata));
        let fa = fungible_asset::mint(&refs.mint_ref, amount);
        primary_fungible_store::deposit(recipient, fa);

        let state = borrow_global_mut<VaultState>(@my_addr);
        state.total_withdrawn = state.total_withdrawn + amount;
    }

    // ============ VULNERABILITY 2: Arithmetic without underflow check ============
    // Subtracts without verifying that total_deposited >= amount.
    // This will abort at runtime but the pattern shows missing validation.

    public entry fun record_withdrawal(account: &signer, amount: u64) acquires VaultState {
        let _addr = signer::address_of(account);
        let state = borrow_global_mut<VaultState>(@my_addr);
        // No check: state.total_deposited >= amount
        state.total_deposited = state.total_deposited - amount;
    }

    // ============ VULNERABILITY 3: ConstructorRef leak ============
    // Returns ConstructorRef from a public function. The caller can use
    // this to generate TransferRef, DeleteRef, etc. and take over the object.

    public fun create_vault_object(creator: &signer): ConstructorRef {
        let constructor_ref = object::create_object(signer::address_of(creator));
        // WRONG: returning ConstructorRef gives full control to caller
        constructor_ref
    }

    // ============ VULNERABILITY 4: Exposed &mut reference ============
    // A public function that takes &mut VaultState allows any module
    // to use mem::swap to replace the data.

    public fun update_state(state: &mut VaultState, deposited: u64, withdrawn: u64) {
        state.total_deposited = deposited;
        state.total_withdrawn = withdrawn;
    }

    // ============ VULNERABILITY 5: No input validation ============
    // The deposit function accepts amount = 0 without rejecting it,
    // and does not validate the recipient address.

    public entry fun deposit(
        sender: &signer,
        metadata: Object<Metadata>,
        recipient: address,
        amount: u64,
    ) acquires VaultState {
        // No check: amount > 0
        // No check: recipient != @0x0
        let fa = primary_fungible_store::withdraw(sender, metadata, amount);
        primary_fungible_store::deposit(recipient, fa);

        let state = borrow_global_mut<VaultState>(@my_addr);
        state.total_deposited = state.total_deposited + amount;
        // VULNERABILITY 6: No events emitted for deposit or withdrawal
    }

    // ============ Test Helpers ============

    #[test_only]
    public fun init_for_test(deployer: &signer) {
        init_module(deployer);
    }
}
