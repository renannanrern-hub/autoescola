import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  deleteCollectionItem,
  isCollectionName,
  readDatabase,
  upsertCollectionItem,
} from "@/lib/store";

type Params = {
  params: Promise<{
    collection: string;
  }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "Acesso administrativo obrigatorio." }, { status: 401 });
  }

  const { collection } = await params;

  if (!isCollectionName(collection)) {
    return NextResponse.json({ error: "Colecao invalida." }, { status: 404 });
  }

  const payload = await request.json();
  const item = {
    ...payload,
    id: payload.id || randomUUID(),
  };

  await upsertCollectionItem(collection, item);

  return NextResponse.json(item, { status: 201 });
}

export async function PUT(request: NextRequest, { params }: Params) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "Acesso administrativo obrigatorio." }, { status: 401 });
  }

  const { collection } = await params;

  if (!isCollectionName(collection)) {
    return NextResponse.json({ error: "Colecao invalida." }, { status: 404 });
  }

  const payload = await request.json();

  if (!payload.id) {
    return NextResponse.json({ error: "ID obrigatorio." }, { status: 400 });
  }

  const database = await readDatabase();
  const items = database[collection] as Array<Record<string, unknown>>;
  const index = items.findIndex((item) => item.id === payload.id);

  if (index < 0) {
    return NextResponse.json({ error: "Registro nao encontrado." }, { status: 404 });
  }

  items[index] = { ...items[index], ...payload };
  await upsertCollectionItem(collection, items[index] as { id: string });

  return NextResponse.json(items[index]);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "Acesso administrativo obrigatorio." }, { status: 401 });
  }

  const { collection } = await params;

  if (!isCollectionName(collection)) {
    return NextResponse.json({ error: "Colecao invalida." }, { status: 404 });
  }

  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID obrigatorio." }, { status: 400 });
  }
  const database = await readDatabase();
  const items = database[collection] as Array<Record<string, unknown>>;
  const exists = items.some((item) => item.id === id);

  if (!exists) {
    return NextResponse.json({ error: "Registro nao encontrado." }, { status: 404 });
  }

  await deleteCollectionItem(collection, id);

  return NextResponse.json({ ok: true });
}
