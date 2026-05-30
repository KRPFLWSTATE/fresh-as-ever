import { isClearanceShelvesEnabled } from './clearanceShelves.js';
import {
  canPublishClearanceShelves,
  canPublishRescueBags,
  outletListingMode,
} from './outletListingMode.js';

/** Centralizes feature-flag + category rules for merchant inventory surfaces. */
export function merchantInventoryVisibility(category) {
  const clearanceOn = isClearanceShelvesEnabled();
  const mode = outletListingMode(category);
  const showShelves = canPublishClearanceShelves(category);
  const showBags = canPublishRescueBags(category);
  return {
    mode,
    clearanceOn,
    showShelves,
    showBags,
    isHybrid: showShelves && showBags,
  };
}

/** Which list screen a single-mode inventory tab should mount (never swap bags/shelves). */
export function pickMerchantInventoryListKind(category) {
  const { showShelves, showBags } = merchantInventoryVisibility(category);
  if (showShelves && !showBags) return 'shelves';
  if (showBags && !showShelves) return 'bags';
  return 'none';
}
