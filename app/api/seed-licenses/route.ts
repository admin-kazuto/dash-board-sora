import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import License from '@/models/License';

// Seed data mẫu cho 5 tools mới
const SEED_DATA = [
    {
        key: "T2V-DEMO-KEY-001",
        description: "Text-to-Video Demo Key",
        max_devices: 2,
        tool_id: 1,
        valid_until: new Date("2030-01-01T00:00:00.000Z"),
        is_active: true,
    },
    {
        key: "T2I-DEMO-KEY-001",
        description: "Text-to-Image Demo Key",
        max_devices: 2,
        tool_id: 2,
        valid_until: new Date("2030-01-01T00:00:00.000Z"),
        is_active: true,
    },
    {
        key: "I2V-DEMO-KEY-001",
        description: "Image-to-Video Demo Key",
        max_devices: 2,
        tool_id: 3,
        valid_until: new Date("2030-01-01T00:00:00.000Z"),
        is_active: true,
    },
    {
        key: "SE-DEMO-KEY-001",
        description: "Start-End Demo Key",
        max_devices: 2,
        tool_id: 4,
        valid_until: new Date("2030-01-01T00:00:00.000Z"),
        is_active: true,
    },
    {
        key: "SYNC-DEMO-KEY-001",
        description: "Character Sync Demo Key",
        max_devices: 2,
        tool_id: 5,
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
                results.push({ key: created.key, tool_id: created.tool_id, status: 'created' });
            } else {
                results.push({ key: item.key, tool_id: item.tool_id, status: 'exists' });
            }
        }

        return NextResponse.json({ success: true, count: results.length, details: results });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
