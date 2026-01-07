import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import License from '@/models/License';

// DELETE: Remove license
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        await License.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PUT: Update license (e.g. reset devices)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        const license = await License.findByIdAndUpdate(id, body, { new: true });
        return NextResponse.json({ success: true, license });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
