function getToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

/**
 * Get usable (non-expired) leave credits
 */
function getUsableCredits(user) {
  const today = getToday();
  const history = Array.isArray(user.leaveCreditHistory)
    ? user.leaveCreditHistory
    : [];

  return history
    .filter((entry) => new Date(entry.expiresOn) >= today)
    .reduce((sum, entry) => sum + entry.amount, 0);
}

/**
 * Deduct leave credits from the oldest valid entries first
 */
function deductLeaveCredits(user, amountToDeduct) {
  console.log("💳 Attempting to deduct", amountToDeduct, "from", user.name);

  const now = new Date();
  const sorted = [...user.leaveCreditHistory]
    .filter((entry) => new Date(entry.expiresOn) > now && entry.amount > 0)
    .sort((a, b) => new Date(a.expiresOn) - new Date(b.expiresOn));

  let remaining = amountToDeduct;

  const updated = sorted.map((entry) => {
    if (remaining <= 0) return entry;

    const deduct = Math.min(entry.amount, remaining);
    remaining -= deduct;

    return {
      ...entry,
      amount: parseFloat((entry.amount - deduct).toFixed(2)),
    };
  });

  if (remaining > 0) {
    throw new Error("Not enough valid leave credits");
  }

  // Merge back untouched entries
  const untouched = user.leaveCreditHistory.filter((e) => !sorted.includes(e));
  const newHistory = [...updated, ...untouched];

  console.log("✅ Updated leaveCreditHistory:", newHistory);
  return newHistory;
}

/**
 * Restore leave credits to an existing entry if expiry matches,
 * otherwise create a new entry
 */
function restoreLeaveCredits(user, amount, originalDate) {
  const dateAdded = originalDate || new Date();
  const year = dateAdded.getFullYear();
  const expiresOn = new Date(`${year + 1}-12-31T23:59:59.999Z`);

  const history = Array.isArray(user.leaveCreditHistory)
    ? user.leaveCreditHistory
    : [];

  // Check if there's already an entry with same expiry
  const existing = history.find(
    (entry) => new Date(entry.expiresOn).getTime() === expiresOn.getTime()
  );

  if (existing) {
    existing.amount = parseFloat((existing.amount + amount).toFixed(2));
  } else {
    history.push({
      amount,
      dateAdded,
      expiresOn,
    });
  }

  return history;
}

module.exports = {
  getUsableCredits,
  deductLeaveCredits,
  restoreLeaveCredits,
};
