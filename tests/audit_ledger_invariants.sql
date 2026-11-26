SELECT id, event_id, gross_amount,
       (platform_fee_amount + gateway_fee_amount + net_payout_amount) AS calculated_sum,
       (gross_amount - (platform_fee_amount + gateway_fee_amount + net_payout_amount)) AS discrepancy
FROM escrow_transfers
WHERE gross_amount <> (platform_fee_amount + gateway_fee_amount + net_payout_amount);

SELECT id, event_id, name, total_capacity, reserved_count, sold_count
FROM ticket_tiers
WHERE sold_count > total_capacity OR reserved_count < 0 OR sold_count < 0;

SELECT entry_type, COUNT(*) AS tx_count, SUM(amount) AS total_inr
FROM ledger_entries
GROUP BY entry_type
ORDER BY entry_type;