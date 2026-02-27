import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import License from '@/models/License';

// === TOOL REGISTRY ===
const TOOL_MAP: Record<number, string> = {
    1: 'Text-to-Video',
    2: 'Text-to-Image',
    3: 'Image-to-Video',
    4: 'Start-End',
    5: 'Character Sync',
    6: 'TTS Studio',
};

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        success: true,
        message: "License check API is fully operational.",
        timestamp: new Date().toISOString(),
        usage: "Send a POST request with license_key, device_id, and tool_id."
    });
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

export async function POST(req: Request) {
    try {
        await dbConnect();

        let body;
        try {
            body = await req.json();
        } catch (e) {
            return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
        }

        const { license_key, device_id, tool_id } = body;

        if (!license_key || !device_id) {
            return NextResponse.json({ success: false, error: 'Missing key or device_id' }, { status: 400 });
        }

        const license = await License.findOne({ key: license_key });

        if (!license) {
            return NextResponse.json({ success: false, status: 'invalid', detail: 'License key not found' });
        }

        if (!license.is_active) {
            return NextResponse.json({ success: false, status: 'invalid', detail: 'License is inactive' });
        }

        if (new Date() > license.valid_until) {
            return NextResponse.json({ success: false, status: 'invalid', detail: 'License expired' });
        }

        // Tool check - verify tool_id exists in license.tools array
        if (tool_id && !license.tools.includes(tool_id)) {
            const allowedNames = license.tools.map((t: number) => TOOL_MAP[t] || `#${t}`).join(', ');
            const requestedName = TOOL_MAP[tool_id] || `Tool #${tool_id}`;
            return NextResponse.json({
                success: false,
                status: 'invalid',
                detail: `${requestedName} is not included in this license. Allowed: ${allowedNames}`
            });
        }

        // Device check and registration
        const devId = String(device_id);
        if (!license.devices.includes(devId)) {
            if (license.devices.length >= license.max_devices) {
                return NextResponse.json({ success: false, status: 'invalid', detail: 'Max devices reached' });
            }

            await License.updateOne(
                { _id: license._id },
                { $addToSet: { devices: devId } }
            );
        }

        return NextResponse.json({ success: true, status: 'valid' });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
