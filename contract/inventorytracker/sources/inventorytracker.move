// Copyright (c) Mysten Labs, Inc.
// Modifications Copyright (c) 2024 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

/// Inventory Tracker Contract
/// A shared object for managing inventorytracker.
/// Rules:
/// - anyone can create and share a inventorytracker
/// - owner can add items
/// - owner can remove items
/// - owner can query count
module inventorytracker::contract {
  /// A shared inventorytracker object.
  public struct Inventorytracker has key {
    id: UID,
    owner: address,
    inventory_count: u64
  }

  /// Create and share a Inventorytracker object.
  public fun create(ctx: &mut TxContext) {
    transfer::share_object(Inventorytracker {
      id: object::new(ctx),
      owner: ctx.sender(),
      inventory_count: 0
    })
  }

  /// Add an item (only owner can add)
  public fun add_inventory(manager: &mut Inventorytracker, ctx: &TxContext) {
    assert!(manager.owner == ctx.sender(), 0);
    manager.inventory_count = manager.inventory_count + 1;
  }

  /// Remove an item (only owner can remove)
  public fun remove_inventory(manager: &mut Inventorytracker, ctx: &TxContext) {
    assert!(manager.owner == ctx.sender(), 0);
    assert!(manager.inventory_count > 0, 1);
    manager.inventory_count = manager.inventory_count - 1;
  }

  /// Get count
  public fun get_inventory_count(manager: &Inventorytracker): u64 {
    manager.inventory_count
  }
}
