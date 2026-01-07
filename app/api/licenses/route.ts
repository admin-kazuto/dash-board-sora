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

// POST: Create new license
export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();

        // Ensure tool_id is present, default to 2 (Sora)
        if (!body.tool_id) {
            body.tool_id = 2;
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
