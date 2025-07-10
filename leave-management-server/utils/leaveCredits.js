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
 * ✅ Returns both updated history and deductedFrom trace
 */
function deductLeaveCredits(user, amountToDeduct) {
  const now = new Date();
  const sorted = [...user.leaveCreditHistory]
    .filter((entry) => new Date(entry.expiresOn) > now && entry.amount > 0)
    .sort((a, b) => new Date(a.expiresOn) - new Date(b.expiresOn));

  let remaining = amountToDeduct;
  const deductedFrom = [];

  const updated = sorted.map((entry) => {
    if (remaining <= 0) return entry;

    const deduct = Math.min(entry.amount, remaining);
    remaining -= deduct;

    deductedFrom.push({
      expiryDate: entry.expiresOn,
      amount: parseFloat(deduct.toFixed(2)),
    });

    return {
      ...entry,
      amount: parseFloat((entry.amount - deduct).toFixed(2)),
    };
  });

  if (remaining > 0) {
    throw new Error("Not enough valid leave credits");
  }

  const untouched = user.leaveCreditHistory.filter((e) => !sorted.includes(e));
  const newHistory = [...updated, ...untouched];

  return {
    updatedHistory: newHistory,
    deductedFrom,
  };
}

/**
 * Restore leave credits to original expiry buckets
 * ✅ Accepts deductedFrom array for precise refund
 */
function restoreLeaveCredits(user, deductedFromArray) {
  const history = Array.isArray(user.leaveCreditHistory)
    ? [...user.leaveCreditHistory]
    : [];

  deductedFromArray.forEach((refundEntry) => {
    const existing = history.find(
      (e) =>
        new Date(e.expiresOn).getTime() ===
        new Date(refundEntry.expiryDate).getTime()
    );

    if (existing) {
      existing.amount = parseFloat(
        (existing.amount + refundEntry.amount).toFixed(2)
      );
    } else {
      history.push({
        amount: parseFloat(refundEntry.amount.toFixed(2)),
        dateAdded: new Date(), // now, since it's a refund
        expiresOn: new Date(refundEntry.expiryDate),
      });
    }
  });

  return history;
}

module.exports = {
  getUsableCredits,
  deductLeaveCredits,
  restoreLeaveCredits,
};
