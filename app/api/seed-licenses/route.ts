import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import License from '@/models/License';

// Seed data demo - hybrid keys
const SEED_DATA = [
    {
        key: "ALL-D3M0K3Y1-FULLACCS-PR0MAXVN-T3ST2026-X9K7W2M4",
        description: "Full Access Demo (All 5 tools)",
        max_devices: 3,
        tools: [1, 2, 3, 4, 5],
        valid_until: new Date("2030-01-01T00:00:00.000Z"),
        is_active: true,
    },
    {
        key: "T2V-D3M0K3Y2-VID30NLY-T3STVN26-QW8R5P1J-B6N4H9Y2",
        description: "Text-to-Video Only Demo",
        max_devices: 1,
        tools: [1],
        valid_until: new Date("2030-01-01T00:00:00.000Z"),
        is_active: true,
    },
    {
        key: "T2V+T2I-D3M0K3Y3-C0MB0VID-IMGVN2026-M3K7L9X1-F5R2W8Q4",
        description: "Video + Image Combo Demo",
        max_devices: 2,
        tools: [1, 2],
        valid_until: new Date("2030-01-01T00:00:00.000Z"),
        is_active: true,
    },
];

export async function GET() {
    try {
        await dbConnect();

        const results = [];
        for (const item of SEED_DATA) {
            const existing = await License.findOne({ key: item.key });
            if (!existing) {
                const created = await License.create(item);
                results.push({ key: created.key, tools: created.tools, status: 'created' });
            } else {
                results.push({ key: item.key, tools: item.tools, status: 'exists' });
            }
        }

        return NextResponse.json({ success: true, count: results.length, details: results });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
