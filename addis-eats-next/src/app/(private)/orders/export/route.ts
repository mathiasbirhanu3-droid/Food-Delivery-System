import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session-server';
import { getOrdersFor } from '@/lib/orders-store';
import { getDish, getUserById } from '@/lib/db';
import { toCsv } from '@/lib/csv';

export const dynamic = 'force-dynamic';

/**
 * AUTH.md — CSV of the caller's OWN order history: session verified HERE
 * (401 — a redirect would be wrong for a download), then the scoped read.
 * Middleware's cookie check is a fast-fail; this handler is the boundary.
 *
 * Two sections in one file:
 *  1) ORDERS — one row per order (the summary)
 *  2) ITEMS  — one row per line item, with full detail: dish, category,
 *     unit price paid, list price, quantity, line total
 *
 * Header comment lines (# prefixed) carry export context. Dates stay ISO
 * (machine-readable, sortable); human formatting lives in lib/format.ts.
 * The identity line comes from the users store via the session userId —
 * the session payload stays minimal by design.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse('unauthenticated', { status: 401 });

  const orders = getOrdersFor(session.userId);
  const user = getUserById(session.userId);

  // ── Section 1 · order rows (summary) ────────────────────────────────
  const orderRows = orders.map((order) => {
    const subtotal = order.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
    return [
      order.id,
      order.placedAt,
      order.status,
      order.zone,
      order.items.reduce((n, item) => n + item.qty, 0),
      subtotal,
      order.fee,
      subtotal + order.fee,
      order.note ?? '',
      order.courier?.name ?? '',
    ];
  });

  // ── Section 2 · item rows (line-level detail) ──────────────────────
  const itemRows: unknown[][] = [];
  for (const order of orders) {
    for (const item of order.items) {
      const dish = getDish(item.dishId);
      itemRows.push([
        order.id,                                   // joins back to section 1
        order.placedAt,
        order.status,
        item.dishId,
        dish?.name ?? item.dishId,                  // fallback: id if dish was deleted
        dish?.category ?? '',
        item.unitPrice,                             // price actually paid (discount applied)
        dish?.price ?? item.unitPrice,              // list price — makes the discount auditable
        item.qty,
        item.qty * item.unitPrice,                  // line total
      ]);
    }
  }

  const header = [
    `ADDIS EATS — ORDER HISTORY`,
    `Customer: ${user?.name ?? session.name} (${user?.email ?? 'unknown'})`,
    `Exported: ${new Date().toISOString()}`,
    `Orders: ${orders.length}`,
  ];

  const csv =
    header.map((h) => `# ${h}`).join('\r\n') + '\r\n' +
    '# ── SECTION 1: ORDERS ──\r\n' +
    toCsv(
      ['Order ID', 'Placed At', 'Status', 'Zone', 'Item Count', 'Subtotal (ETB)', 'Delivery Fee (ETB)', 'Total (ETB)', 'Note', 'Courier'],
      orderRows,
    ).replace(/^\uFEFF/, '') + '\r\n' +
    '# ── SECTION 2: ORDER ITEMS (detail) ──\r\n' +
    toCsv(
      ['Order ID', 'Placed At', 'Order Status', 'Dish ID', 'Dish Name', 'Category', 'Unit Price Paid (ETB)', 'List Price (ETB)', 'Qty', 'Line Total (ETB)'],
      itemRows,
    );

  const filename = `addis-eats-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}