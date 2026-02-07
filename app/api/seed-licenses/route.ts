import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import License from '@/models/License';

// Seed data demo - hybrid keys
const SEED_DATA = [
    {
        key: "ALL-FULL-DEMO-001",
        description: "Full Access Demo (All 5 tools)",
        max_devices: 3,
        tools: [1, 2, 3, 4, 5],
        valid_until: new Date("2030-01-01T00:00:00.000Z"),
        is_active: true,
    },
    {
        key: "T2V-ONLY-DEMO-001",
        description: "Text-to-Video Only Demo",
        max_devices: 1,
        tools: [1],
        valid_until: new Date("2030-01-01T00:00:00.000Z"),
        is_active: true,
    },
    {
        key: "T2V+T2I-DEMO-001",
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
