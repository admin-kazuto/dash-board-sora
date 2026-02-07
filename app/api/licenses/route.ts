import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import License from '@/models/License';

// GET: List all licenses
export async function GET() {
    try {
        await dbConnect();
        const licenses = await License.find({}).sort({ created_at: -1 });
        return NextResponse.json({ success: true, licenses });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE: Remove all licenses (reset database)
export async function DELETE() {
    try {
        await dbConnect();
        const result = await License.deleteMany({});
        return NextResponse.json({ success: true, deleted: result.deletedCount });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST: Create new license
export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();

        // Ensure tools array is present, default to all 5 tools
        if (!body.tools || !Array.isArray(body.tools) || body.tools.length === 0) {
            body.tools = [1, 2, 3, 4, 5];
        }

        // Default valid for 30 days if not specified
        if (!body.valid_until) {
            const date = new Date();
            date.setDate(date.getDate() + 30);
            body.valid_until = date;
        }

        const license = await License.create(body);
        return NextResponse.json({ success: true, license });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
