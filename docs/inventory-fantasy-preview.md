# Inventory appearance trial

Source: https://laphkal.itch.io/pixel-fantasy-ui-pack
Credit: UI art: Zanyar’s Asset Store. Terms: src/assets/inventory-fantasy/README.txt.

Only the appearance is changed. Existing slots, locks, scrollbars, inventory data and use callbacks are retained.

To compare with the original appearance, add inventory-style=classic to the game URL (preserve any other query parameters). For example: ?shop-test=1&inventory-style=classic.

To revert permanently: remove the InventoryFantasy.css import and the inventory-fantasy-preview class assignment from InventoryView.ts. The original inline styles and original slot assets remain intact. Remove the new CSS/assets and their credit entry only when no longer used. Do not reset the whole working tree: settings changes are separate.
