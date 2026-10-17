import { NextRequest, NextResponse } from 'next/server';
import { getDishes } from '@/lib/db';
import { CATEGORIES } from '@/features/menu/categories';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = (params.get('q') ?? '').trim().toLowerCase();
  const categoryParam = params.get('category') ?? '';

  let dishes = getDishes();

  const category = CATEGORIES.find((c) => c === categoryParam); // never trust the URL blindly
  if (category) dishes = dishes.filter((d) => d.category === category);

  if (q) {
    dishes = dishes.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.ingredients.some((i) => i.toLowerCase().includes(q)),
    );
  }

  return NextResponse.json({ dishes });
}