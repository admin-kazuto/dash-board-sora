import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import License from '@/models/License';

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

        // Tool ID check (1: Veo, 2: Sora)
        if (tool_id && license.tool_id !== tool_id) {
            const toolName = license.tool_id === 1 ? "Veo" : "Sora";
            return NextResponse.json({ success: false, status: 'invalid', detail: `This key is for ${toolName} only` });
        }

        // Device check and registration
        const devId = String(device_id);
        if (!license.devices.includes(devId)) {
            if (license.devices.length >= license.max_devices) {
                return NextResponse.json({ success: false, status: 'invalid', detail: 'Max devices reached' });
            }

            // Atomic update to ensure it saves in serverless environment
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
